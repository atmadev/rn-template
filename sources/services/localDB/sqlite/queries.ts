import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import { PersistentShaped, ShapeName, Expand } from 'shared/types/primitives'
import { Querible, WhereItem, OrderItem, AllowedOperators, InferValue } from './types'
import { transaction } from './utils'
import { mapKeys } from 'shared/types/utils'

export class SelectQuery<
	TableName extends ShapeName,
	SelectedColumn extends keyof Object,
	Object = PersistentShaped<TableName>,
	QueribleObject = Querible<Object>,
	QueribleColumn = keyof QueribleObject,
> {
	private readonly selectedColumns: SelectedColumn[] = []
	private readonly orderItems: OrderItem<QueribleColumn>[] = []
	private readonly table: TableName

	private readonly whereEngine: WhereEngine<TableName, typeof this.actions>

	where: typeof this.whereEngine.where

	constructor(table: TableName, columns: SelectedColumn[]) {
		this.table = table
		this.selectedColumns = columns
		this.whereEngine = new WhereEngine(this.actions)
		this.where = this.whereEngine.where
	}

	private get sql() {
		const args = this.whereEngine.args
		const sql =
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'} FROM ${
				this.table
			}` +
			this.whereEngine.clause +
			(this.orderItems.length > 0 ? '\nORDER BY ' + this.orderItems.join(',') : '')

		return { sql, args }
	}

	private get actions() {
		return {
			run: this.run,
			orderBy: this.orderBy,
		}
	}

	orderBy = (...keys: OrderItem<QueribleColumn>[]) => {
		this.orderItems.push(...keys)
		return this
	}

	run = async (): Promise<Expand<Pick<Object, SelectedColumn>>[]> => {
		const objects = await transaction((tx, resolve) => {
			const { sql, args } = this.sql
			tx.query(sql, args, resolve)
		})

		const start = Date.now()

		const objectKeys = mapKeys(this.table, (key, type, flags) => {
			if (
				flags.includes('transient') ||
				typeof type !== 'object' ||
				(this.selectedColumns.length > 0 && !this.selectedColumns.includes(key as any))
			)
				return null
			return key
		})

		if (objectKeys.length > 0) {
			objects.forEach((o: any) =>
				objectKeys.forEach((k) => {
					const value = o[k]
					if (value) o[k] = JSON.parse(value)
				}),
			)
		}

		console.log('Mapping time', Date.now() - start)

		return objects
	}
}

export class InsertQuery<TableName extends ShapeName, Object = PersistentShaped<TableName>> {
	readonly table: TableName
	readonly objects: Object[]

	constructor(table: TableName, objects: Object[]) {
		this.table = table
		this.objects = objects
	}

	private get sql(): Query {
		const args: any[] = []
		const sql =
			`INSERT OR REPLACE INTO ${this.table} VALUES\n` +
			this.objects
				.map((o) => {
					return (
						'(' +
						mapKeys(this.table, (key, type, flags) => {
							if (flags.includes('transient')) return null
							// @ts-ignore
							const value = o[key] ?? ''
							args.push(typeof type === 'object' ? JSON.stringify(value) : value)
							return '?'
						}).join(',') +
						')'
					)
				})
				.join(',\n')

		return { sql, args }
	}

	run = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}

export class UpdateQuery<
	TableName extends ShapeName,
	Object = Partial<PersistentShaped<TableName>>,
> {
	readonly table: TableName
	readonly object: Object
	private readonly whereEngine: WhereEngine<TableName, typeof this.actions>
	where: typeof this.whereEngine.where

	constructor(table: TableName, object: Object) {
		this.table = table
		this.object = object
		this.whereEngine = new WhereEngine(this.actions)
		this.where = this.whereEngine.where
	}

	get sql() {
		const args: any[] = []
		const sql =
			'UPDATE ' +
			this.table +
			' SET ' +
			Object.entries(this.object)
				.map(([k, v]) => {
					args.push(typeof v === 'object' ? JSON.stringify(v) : v)
					return k + ' = ?'
				})
				.join(', ') +
			this.whereEngine.clause

		args.push(...this.whereEngine.args)

		return { sql, args }
	}

	private get actions() {
		return {
			run: this.run,
		}
	}

	run = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}

export class DeleteQuery<TableName extends ShapeName> {
	readonly table: TableName
	private readonly whereEngine: WhereEngine<TableName, typeof this.actions>
	where: typeof this.whereEngine.where

	constructor(table: TableName) {
		this.table = table
		this.whereEngine = new WhereEngine(this.actions)
		this.where = this.whereEngine.where
	}

	get sql() {
		const args: any[] = this.whereEngine.args
		const sql = 'DELETE FROM ' + this.table + this.whereEngine.clause

		return { sql, args }
	}

	private get actions() {
		return {
			run: this.run,
		}
	}

	run = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}

class WhereEngine<TableName extends ShapeName, Actions, Object = PersistentShaped<TableName>> {
	readonly items: WhereItem[][] = []
	private readonly actions: Actions
	get args() {
		return this.items.flatMap((items) =>
			items.flatMap((i) => i.value).filter((v) => v !== 'NULL' && v !== 'NOT NULL'),
		)
	}

	get clause() {
		return this.items.length > 0
			? ' WHERE ' +
					this.items
						.map((items) => {
							return (
								'(' +
								items
									.map((i) => {
										const expression = i.key + ' ' + i.operator + ' '
										if (i.operator.includes('BETWEEN')) return expression + '? AND ?'
										else if (i.operator.includes('IN'))
											return expression + '(' + i.value.map(() => '?').join(',') + ')'
										else if (i.operator.includes('LIKE')) return expression + '?'
										else if (i.operator === 'IS') return expression + i.value
										else return expression + '?'
									})
									.join(' OR ') +
								')'
							)
						})
						.join(' AND ')
			: ''
	}

	constructor(actions: Actions) {
		this.actions = actions
	}

	where = <K extends keyof Querible<Object>, O extends AllowedOperators<Querible<Object>[K]>>(
		key: K,
		operator: O,
		value: InferValue<Querible<Object>, K, O>,
	) => {
		this.items.push([{ key: key as string, operator, value }])
		return {
			where: this.where,
			and: this.andWhere,
			or: this.orWhere,
			...this.actions,
		}
	}

	protected orWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
	>(
		key: K,
		operator: O,
		value: InferValue<Querible<Object>, K, O>,
	) => {
		getLast(this.items)?.push({ key: key as string, operator, value })
		return {
			or: this.orWhere,
			...this.actions,
		}
	}

	protected andWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
	>(
		key: K,
		operator: O,
		value: InferValue<Querible<Object>, K, O>,
	) => {
		this.items.push([{ key: key as string, operator, value }])
		return {
			and: this.andWhere,
			...this.actions,
		}
	}
}
