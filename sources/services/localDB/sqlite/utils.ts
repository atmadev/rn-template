import { openDatabase, SQLTransaction, SQLResultSet, SQLError } from 'expo-sqlite'

const db = openDatabase('db')

const wrapTansaction = (tx: SQLTransaction) => ({
	query(
		query: string,
		args?: any[],
		success?: (result: SQLResultSet, array: any[]) => void,
		error?: (error: SQLError) => void,
	) {
		console.log('[SQL]:', query, args ?? '')

		tx.executeSql(
			query,
			args,
			(_, result) => {
				// @ts-ignore
				const array = result.rows._array
				success?.(result, array)
			},
			(_, e) => {
				error?.(e)
				return true
			},
		)
	},
})

export const transaction = async <T>(
	handler: (tx: ReturnType<typeof wrapTansaction>, resolve: (result: T) => void) => void,
): Promise<T> =>
	new Promise((resolve, reject) => {
		let result: T
		db.transaction(
			(tx) => {
				handler(wrapTansaction(tx), (r) => (result = r))
			},
			reject,
			() => {
				resolve(result)
			},
		)
	})
