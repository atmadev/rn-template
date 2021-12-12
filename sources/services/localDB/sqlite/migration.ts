import { transaction, Transaction } from './engine'
import { pick, hash, mapFromArray } from 'services/utils'
import { ShapeName } from 'shared/types/primitives'
import { shapes } from 'shared/types'
import { mapKeys } from 'shared/types/utils'
import { indexList, tableInfo } from './engine'
import { SQLSchema, SQLIndexInfo, SQLColumnInfo } from './types'
import { indexName } from './utils'

export const setUpSchemaIfNeeded = async <UsedShapeName extends ShapeName>(
	schema: SQLSchema<UsedShapeName>,
) => {
	// MIGRATION
	// get db schema hash
	const dbConfigRaw: DBConfigItem[] = await transaction((tx, resolve) => {
		tx.query('SELECT sqlite_version()', undefined, handleSQLiteVersionResult)
		tx.query('CREATE TABLE IF NOT EXISTS _Config (key PRIMARY KEY NOT NULL, value NOT NULL)')
		tx.query(`SELECT * FROM _Config`, [], resolve)
	})

	const dbConfig = mapFromArray(dbConfigRaw, 'key', 'value') as DBConfig

	const dbSchemaHash = dbConfig?.schemaHash
	// console.log('dbConfig', dbConfig)

	const shapeNames = Object.keys(schema) as UsedShapeName[]
	const currentShapes = pick(shapes, ...shapeNames)
	const complexSchema = { schema, currentShapes }

	const currentSchemaHash = hash(JSON.stringify(complexSchema))
	// console.log('currentSchemaHash', currentSchemaHash)

	// if no schema hash
	if (!dbSchemaHash) {
		console.log('createTablesFromScratch')
		return createTablesFromScratch(schema, currentSchemaHash)
	}
	// if schema hash the same
	if (dbSchemaHash === currentSchemaHash) {
		// console.log('Setup is not needed')
		return
	}

	return migrateTables(schema, currentSchemaHash, dbConfig?.tableNames?.split(',') ?? [])
}

const createTableFromScratch = <UsedShapeName extends ShapeName>(
	tx: Transaction,
	shapeName: UsedShapeName,
	schemaItem: SQLSchema<UsedShapeName>[UsedShapeName],
) => {
	const createdColumns = mapKeys(shapeName, (key, { type, flags, required, primary }) => {
		if (flags.includes('transient')) return null
		let columnDefinition = key
		if (primary) {
			if (type === '_number') columnDefinition += ' INTEGER'
			columnDefinition += ' PRIMARY KEY'
		}
		if (required) columnDefinition += ' NOT NULL'
		return columnDefinition
	})

	tx.query(`CREATE TABLE ${shapeName} (${createdColumns.join(', ')})`)
	// prettier-ignore
	schemaItem.unique?.forEach((columns) =>
		tx.query(`CREATE UNIQUE INDEX ${indexName(shapeName, columns as string[])} ON ${shapeName} (${columns.join(', ')})`))
	// prettier-ignore
	schemaItem.index?.forEach((columns) =>
		tx.query(`CREATE INDEX IF NOT EXISTS ${indexName(shapeName, columns as string[])} ON ${shapeName} (${columns.join(', ')})`))
}

const createTablesFromScratch = <UsedShapeName extends ShapeName>(
	schema: SQLSchema<UsedShapeName>,
	hash: number,
) =>
	transaction((tx) => {
		const shapeNames = Object.keys(schema) as UsedShapeName[]
		shapeNames.forEach((shapeName) => {
			const schemaItem = schema[shapeName]
			createTableFromScratch(tx, shapeName, schemaItem)
		})

		writeConfig(tx, hash, shapeNames)
	})

const migrateTables = async <UsedShapeName extends ShapeName>(
	schema: SQLSchema<UsedShapeName>,
	hash: number,
	oldTableNames: string[],
) => {
	const shapeNames = Object.keys(schema) as UsedShapeName[]

	const [tableInfosList, indexListsList] = await Promise.all([
		tableInfo(oldTableNames),
		indexList(oldTableNames),
	])

	const oldTableInfos = {} as { [key: string]: SQLColumnInfo[] }
	oldTableNames.forEach((n, i) => (oldTableInfos[n] = tableInfosList[i]))

	console.log('oldTableInfos before', Object.keys(oldTableInfos))

	const oldIndexLists = {} as { [key: string]: SQLIndexInfo[] }
	oldTableNames.forEach((n, i) => (oldIndexLists[n] = indexListsList[i]))

	return transaction((tx) => {
		// ENUMERATE TABLES
		shapeNames.forEach((shapeName) => {
			const schemaItem = schema[shapeName]
			let tableInfo = oldTableInfos[shapeName]
			let indexList = oldIndexLists[shapeName]

			// | if not exists
			if (!tableInfo) {
				let oldTableName: string | null = null
				schemaItem.tableNamesHistory?.forEach((n) => {
					if (!tableInfo) {
						tableInfo = oldTableInfos[n]
						if (tableInfo) {
							indexList = oldIndexLists[n]
							oldTableName = n
							delete oldTableInfos[n]
						}
					}
				})

				if (tableInfo && oldTableName) {
					// RENAME TABLE
					tx.query(`ALTER TABLE ${oldTableName} RENAME TO ${shapeName}`)
				} else {
					// CREATE TABLE FROM SCRATCH
					createTableFromScratch(tx, shapeName, schemaItem)
					return
				}
			} else delete oldTableInfos[shapeName]

			// MIGRATE TABLE
			const tableInfoMap = mapFromArray(tableInfo, 'name', undefined)
			mapKeys(shapeName, (key, { flags, required, primary }) => {
				if (flags.includes('transient')) return null
				// if column not exist
				let oldColumnName
				if (!tableInfoMap[key]) {
					// look up history
					// prettier-ignore
					oldColumnName = schemaItem.columnNamesHistory?.[key as UsedShapeName]?.find(on => tableInfoMap[on])

					if (oldColumnName) {
						// RENAME COLUMN
						tx.query(`ALTER TABLE ${shapeName} RENAME ${oldColumnName} TO ${key}`)
					} else {
						// ADD COLUMN
						// forbid NOT NULL and PRIMARY for new fields
						// prettier-ignore
						if (required) throw new Error('SQLiteEngine error: tried to add required field ' + key + ' to the existing table ' + shapeName)
						// prettier-ignore
						if (primary) throw new Error('SQLiteEngine error: tried to add primary field ' + key + ' to the existing table ' + shapeName)
						// ADD COLUMN
						tx.query(`ALTER TABLE ${shapeName} ADD ${key}`)
					}
				}
				// delete from table info map
				delete tableInfoMap[oldColumnName ?? key]
			})

			const indexListMap = mapFromArray(indexList, 'name', undefined)

			const params = { tx, shapeName, schemaItem, indexListMap }
			migrateIndex(1, params)
			migrateIndex(0, params)

			for (const indexName in indexListMap) {
				const index = indexListMap[indexName]
				if (index.origin === 'c') tx.query('DROP INDEX ' + indexName)
			}

			// DROP COLUMNS
			// It should be done after indexes dropping
			for (const deletedColumn in tableInfoMap) {
				if (SQLiteVersion >= 3.35) tx.query(`ALTER TABLE ${shapeName} DROP ${deletedColumn}`)
				else if (tableInfoMap[deletedColumn].notnull === 0)
					tx.query(`UPDATE ${shapeName} SET ${deletedColumn} = NULL`)
			}
		})

		console.log('oldTableInfos after', Object.keys(oldTableInfos))
		// DROP TABLES
		for (const oldTableName in oldTableInfos) tx.query('DROP TABLE ' + oldTableName)

		writeConfig(tx, hash, shapeNames)
	})
}

// prettier-ignore
const migrateIndex = <UsedShapeName extends ShapeName>(
	unique: 0 | 1, { tx, shapeName, schemaItem, indexListMap }: {
		tx: Transaction,
		shapeName: UsedShapeName,
		schemaItem: SQLSchema<UsedShapeName>[UsedShapeName],
		indexListMap: { [name: string]: SQLIndexInfo }
	}
) => {
	const list = unique ? schemaItem.unique : schemaItem.index

	list?.forEach((columns) => {
		const name = indexName(shapeName, columns as string[])
		let index: SQLIndexInfo | null = indexListMap[name]

		if (index && index.unique !== unique) {
			tx.query('DROP INDEX ' + name)
			index = null
		}

		if (!index) tx.query(`CREATE${unique ? ' UNIQUE' : ''} INDEX ${name} ON ${shapeName} (${columns.join(', ')})`)

		delete indexListMap[name]
	})
}

// prettier-ignore
const writeConfig = (tx: Transaction, hash: number, shapeNames: string[]) => 
	tx.query(`REPLACE INTO _Config VALUES ('schemaHash', ${hash}), ('tableNames', '${shapeNames.join(',')}')`)

let SQLiteVersion = 0.0

const handleSQLiteVersionResult = (result: any[]) => {
	const string = result[0]['sqlite_version()'] as string
	const [major, minor] = string.split('.')

	SQLiteVersion = parseFloat(major + '.' + minor)
	console.log('SQLiteVersion', SQLiteVersion)
}

interface DBConfigItem {
	key: string
	value: string | number
}

interface DBConfig {
	schemaHash: number
	tableNames: string
}
