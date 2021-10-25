import { transaction, Transaction } from './engine'
import { pick, hash, mapFromArray } from 'services/utils'
import { ShapeName } from 'shared/types/primitives'
import { shapes } from 'shared/types'
import { mapKeys } from 'shared/types/utils'
import { indexList, tableInfo } from './engine'
import { SQLSchema, SQLIndexInfo } from './types'
import { indexName } from './utils'

export const setUpSchemaIfNeeded = async <UsedShapeName extends ShapeName>(
	schema: SQLSchema<UsedShapeName>,
) => {
	// MIGRATION
	// get db schema hash
	const [dbSchemaHashResult] = await transaction((tx, resolve) => {
		// tx.query('SELECT sqlite_version()', undefined, flatLog)
		// tx.query(`SELECT sql FROM sqlite_master`, undefined, console.log)
		tx.query('CREATE TABLE IF NOT EXISTS _Config (key PRIMARY KEY NOT NULL, value NOT NULL)')
		tx.query(`SELECT value FROM _Config WHERE key = 'schemaHash'`, [], resolve)
	})

	const dbSchemaHash = dbSchemaHashResult?.value
	console.log('dbSchemaHash', dbSchemaHash)

	const shapeNames = Object.keys(schema) as UsedShapeName[]
	const currentShapes = pick(shapes, ...shapeNames)
	const complexSchema = { schema, currentShapes }

	const currentSchemaHash = hash(JSON.stringify(complexSchema))
	console.log('currentSchemaHash', currentSchemaHash)

	// if no schema hash
	if (!dbSchemaHash) {
		console.log('createTablesFromScratch')
		return createTablesFromScratch(schema, currentSchemaHash)
	}
	// if schema hash the same
	if (dbSchemaHash === currentSchemaHash) {
		console.log('Setup is not needed')
		return
	}

	return migrateTables(schema, currentSchemaHash)
}

const createTableFromScratch = <UsedShapeName extends ShapeName>(
	tx: Transaction,
	shapeName: UsedShapeName,
	schemaItem: SQLSchema<UsedShapeName>[UsedShapeName],
) => {
	const createdColumns = mapKeys(shapeName, (key, type, flags, required) => {
		if (flags.includes('transient')) return null
		let columnDefinition = key
		if (schemaItem.primaryKey === key) {
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
		for (const shapeNameString in schema) {
			const shapeName = shapeNameString as UsedShapeName
			const schemaItem = schema[shapeName]
			createTableFromScratch(tx, shapeName, schemaItem)
		}
		tx.query(`INSERT INTO _Config VALUES ('schemaHash', ${hash})`)
	})

const migrateTables = async <UsedShapeName extends ShapeName>(
	schema: SQLSchema<UsedShapeName>,
	hash: number,
) => {
	const shapeNames = Object.keys(schema) as UsedShapeName[]
	const [tableInfos, indexLists] = await Promise.all([tableInfo(shapeNames), indexList(shapeNames)])
	// console.log('tableInfos', tableInfos)
	// console.log('indexLists', indexLists)

	return transaction((tx) => {
		// ENUMERATE TABLES
		shapeNames.forEach((shapeName, i) => {
			const schemaItem = schema[shapeName]
			const tableInfo = tableInfos[i]

			// | if not exists
			if (tableInfo.length === 0) {
				// CREATE TABLE FROM SCRATCH
				createTableFromScratch(tx, shapeName, schemaItem)
				return
			}

			// MIGRATE TABLE
			const tableInfoMap = mapFromArray(tableInfo, 'name')
			mapKeys(shapeName, (key, _, flags, required) => {
				if (flags.includes('transient')) return null
				// if column not exist
				let oldColumnName
				if (!tableInfoMap[key]) {
					// look up history
					// TODO: test renaming
					// prettier-ignore
					oldColumnName = schemaItem.namesHistory?.[key as UsedShapeName]?.find(on => tableInfoMap[on])

					if (oldColumnName) {
						// RENAME COLUMN
						tx.query(`ALTER TABLE ${shapeName} RENAME COLUMN ${oldColumnName} TO ${key}`)
					} else {
						// ADD COLUMN
						// forbid NOT NULL and PRIMARY for new fields
						// prettier-ignore
						if (required) throw new Error('SQLiteEngine error: tried to add required field ' + key + ' to the existing table ' + shapeName)
						// prettier-ignore
						if (schemaItem.primaryKey === key) throw new Error('SQLiteEngine error: tried to add primary field ' + key + ' to the existing table ' + shapeName)
						// ADD COLUMN
						tx.query(`ALTER TABLE ${shapeName} ADD ${key}`)
					}
				}
				// delete from table info map
				delete tableInfoMap[oldColumnName ?? key]
			})

			const indexList = indexLists[i]
			const indexListMap = mapFromArray(indexList, 'name')

			// TODO: create my own schema index map, merge regular and unique indexes, unique will override regular

			const params = { tx, shapeName, schemaItem, indexListMap }
			migrateIndex(1, params)
			migrateIndex(0, params)

			for (const indexName in indexListMap) {
				const index = indexListMap[indexName]
				if (index.origin === 'c') tx.query('DROP INDEX ' + indexName)
			}

			// DROP COLUMNS
			// TODO: remove all values from dropped column
			// TODO: uncomment when will be supported, add sqlite version check
			// It should be done after indexes dropping
			// for (const deletedColumn in tableInfoMap) {
			// 	tx.query(`ALTER TABLE ${shapeName} DROP ${deletedColumn}`)
			// }
		})

		// TODO: drop unused tables
		// set new schema hash
		tx.query(`REPLACE INTO _Config VALUES ('schemaHash', ${hash})`)
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
		// prettier-ignore
		if (!index) tx.query(`CREATE${unique ? ' UNIQUE' : ''} INDEX ${name} ON ${shapeName} (${columns.join(', ')})`)

		delete indexListMap[name]
	})
}
