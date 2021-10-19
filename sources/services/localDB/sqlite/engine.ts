import { openDatabase, SQLTransaction, SQLError } from 'expo-sqlite'
import { capitalized, hash, pick } from 'services/utils'
import { ShapeName } from 'shared/types/primitives'
import { shapes } from 'shared/types/shapes'
import { mapKeys } from 'shared/types/utils'
import { SQLiteIndexInfo, SQLiteRowInfo } from './types'

const db = openDatabase('dbV3')

export const setUpSchemaIfNeeded = async <UsedShapeNames extends ShapeName>(
	...shapeNames: UsedShapeNames[]
) => {
	const result = await indexList(['Profile'])
	console.log('index_list', result)

	const [dbSchemaHashResult] = await transaction((tx, resolve) => {
		// tx.query('SELECT sqlite_version()', undefined, flatLog)
		tx.query('CREATE TABLE IF NOT EXISTS _Config (key UNIQUE NOT NULL, value NOT NULL)')
		tx.query(`SELECT value FROM _Config WHERE key = 'schemaHash'`, [], resolve)
	})

	const dbSchemaHash = dbSchemaHashResult?.value
	// console.log('dbSchemaHash', dbSchemaHash)

	const currentShapes = pick(shapes, ...shapeNames)

	const currentSchemaHash = hash(JSON.stringify(currentShapes))
	// console.log('currentSchemaHash', currentSchemaHash)

	const schemaSetUpNeeded = !dbSchemaHash || dbSchemaHash !== currentSchemaHash

	// console.log('schemaSetUpNeeded', schemaSetUpNeeded)

	if (!schemaSetUpNeeded) return

	const tableInfoPragmas = await tableInfo(shapeNames)
	console.log('tableInfoPragmas', tableInfoPragmas)

	// const tableInfos = {} as { [K in UsedShapeNames]: SQLiteRowInfo[] }

	// MIGRATION
	// get schema hash
	// if no schema hash
	// | create tables & write hash
	// | return
	// if schema hash the same
	// | return
	// get table infos, create map
	// TODO: investigate indexes info
	// enumerate shapes
	// | if not exists
	// | | create table
	// | | continue
	// | mapKeys
	// | | if not exist
	// | | | add
	// | | | forbid NOT NULL for new fields
	// | | if hasn't index, add
	// | | delete from table info map
	// | delete rest columns from table info
	// set new schema hash

	await transaction((tx) => {
		for (const shapeName of shapeNames) {
			const createColumns = mapKeys(shapeName, (key, _, flags, required) => {
				if (flags.includes('transient')) return null
				let string = key
				if (required) string += ' NOT NULL'

				// TODO: add UNIQUE index manually to manage shape changes

				if (flags.includes('unique')) string += ' UNIQUE'
				return string
			})

			const indexColumns = mapKeys(shapeName, (key, _, flags) => {
				if (flags.includes('unique') || !flags.includes('indexed')) return null
				return key
			})

			tx.query(`CREATE TABLE IF NOT EXISTS ${shapeName} (${createColumns.join(', ')})`)

			indexColumns.forEach((i) =>
				tx.query(
					`CREATE INDEX IF NOT EXISTS ${
						shapeName + capitalized(i) + 'Index'
					} ON ${shapeName} (${i})`,
				),
			)

			/*
			tx.query(
				`PRAGMA table_info(${shapeName});'`,
				undefined,
				(array) => {
					tableInfos[shapeName] = array
				},
				(error) => console.log('Columns check error', error),
			) */
		}
		tx.query(`INSERT OR REPLACE INTO _Config VALUES ('schemaHash', ${currentSchemaHash})`)
	})

	// console.log('setUpSchema success')
	/*
	const config = await transaction((tx, resolve) => {
		tx.query('SELECT * FROM _Config', [], resolve)
	})
	 console.log('config', config) */

	// Validate unique indexes
	// Remove uneeded indexes
	// validate are all fields presented in the SQLite
	// console.log('infos', tableInfos)
}

const wrapTansaction = (tx: SQLTransaction) => ({
	query(
		query: string,
		args?: any[],
		success?: (result: any[]) => void,
		error?: (error: SQLError) => void,
	) {
		console.log(
			'[SQL]:',
			query.length > 200 ? query.substr(0, 200) + '...' : query,
			args && args.length > 0 ? '\nArgs ' + args : '',
		)
		// const start = Date.now()
		tx.executeSql(
			query,
			args,
			(_, result) => {
				// console.log('SQL time', Date.now() - start)

				// @ts-ignore
				const array = result.rows._array
				success?.(array)
			},
			(_, e) => {
				error?.(e)
				return true
			},
		)
	},
})

const createTransactionMethod =
	(readonly: boolean) =>
	(
		handler: (tx: ReturnType<typeof wrapTansaction>, resolve: (result: any[]) => void) => void,
	): Promise<any> =>
		new Promise((resolve, reject) => {
			let result: any[]
			const method = (readonly ? db.readTransaction : db.transaction).bind(db)
			method(
				(tx) => {
					handler(wrapTansaction(tx), (r) => (result = r))
				},
				reject,
				() => {
					resolve(result)
				},
			)
		})

export const transaction = createTransactionMethod(false)
export const readTransaction = createTransactionMethod(true)

const pragma = (...funcs: string[]) =>
	new Promise<any[]>((resolve, reject) => {
		db.exec(
			funcs.map((f) => {
				const sql = 'PRAGMA ' + f
				console.log('[SQL]: ', sql)
				return { sql, args: [] }
			}),
			true,
			(error, resultSet) => {
				if (error) reject(error)
				else {
					if (!resultSet) {
						resolve([])
						return
					}
					resolve(
						resultSet.map((set) => {
							if ('error' in set) return set.error
							else {
								// @ts-ignore
								return set.rows
							}
						}),
					)
				}
			},
		)
	})

const tableInfo = (tables: string[]): Promise<SQLiteRowInfo[][]> =>
	pragma(...tables.map((t) => `table_info(${t});`))

const indexList = (tables: string[]): Promise<SQLiteIndexInfo[][]> =>
	pragma(...tables.map((t) => `index_list(${t});`))
