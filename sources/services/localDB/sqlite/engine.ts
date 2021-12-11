import { openDatabase, SQLTransaction, SQLError } from 'expo-sqlite'
import { SQLColumnInfo, SQLIndexInfo } from './types'

const db = openDatabase('rn-template-db10.sqlite')

export const tableInfo = (tables: string[]): Promise<SQLColumnInfo[][]> =>
	pragma(...tables.map((t) => `table_info(${t});`))

export const indexList = (tables: string[]): Promise<SQLIndexInfo[][]> =>
	pragma(...tables.map((t) => `index_list(${t});`))

const wrapTansaction = (tx: SQLTransaction) => ({
	query(
		query: string,
		args?: any[],
		success?: (result: any[]) => void,
		error?: (error: SQLError) => void,
	) {
		console.log(
			query.length > 200 ? query.substr(0, 200) + '...' : query,
			args && args.length > 0 ? '[ ' + args.slice(0, 50).join(', ') : '',
			args && args.length > 0
				? args.length > 50
					? ', ... more ' + (args.length - 50) + ' args ]'
					: ']'
				: '',
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

export type Transaction = ReturnType<typeof wrapTansaction>

const createTransactionMethod =
	(readonly: boolean) =>
	(handler: (tx: Transaction, resolve: (result: any[]) => void) => void): Promise<any> =>
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
				console.log(sql)
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
