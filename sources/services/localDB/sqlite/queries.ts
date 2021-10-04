import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import { PersistentShaped, ShapeName, Expand } from 'shared/types/primitives'
import { Querible, WhereItem, OrderItem, AllowedOperators, InferValue } from './types'
import { transaction } from './utils'
import { mapKeys } from 'shared/types/utils'

abstract class WhereQuery<
	TableName extends ShapeName,
	Result,
	Object = PersistentShaped<TableName>,
> {
	protected readonly whereItems: WhereItem[][] = []

	protected get whereClause() {
		return this.whereItems.length > 0
			? ' WHERE ' +
					this.whereItems
						.map((items) => {
							return (
								(items.length > 1 ? '(' : '') +
								items
									.map((i) => {
										const string = i.key + ' ' + i.operator + ' '
										if (i.operator.includes('BETWEEN')) return string + '? AND ?'
										else if (i.operator.includes('IN'))
											return string + '(' + i.value.map(() => '?').join(',') + ')'
										else if (i.operator.includes('LIKE')) return string + '?'
										else if (i.operator === 'IS') return string + i.value
										else return string + '?'
									})
									.join(' OR ') +
								(items.length > 1 ? ')' : '')
							)
						})
						.join(' AND ')
			: ''
	}

	get orItems() {
		return {
			or: this.orWhere,
			run: this.run,
		}
	}

	where = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends Querible<Object>[K],
		Value = InferValue<Querible<Object>, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			or: this.orWhere,
			run: this.run,
		}
	}

	protected orWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends Querible<Object>[K],
		Value = InferValue<Querible<Object>, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		getLast(this.whereItems)?.push({ key, operator, value })
		return this.orItems
	}

	protected andWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends Querible<Object>[K],
		Value = InferValue<Querible<Object>, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			run: this.run,
		}
	}

	protected abstract get sql(): Query

	run = async (): Promise<Result> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}

export class SelectQuery<
	TableName extends ShapeName,
	SelectedColumn extends keyof Object,
	Object = PersistentShaped<TableName>,
	QueribleObject = Querible<Object>,
	QueribleColumn = keyof QueribleObject,
> extends WhereQuery<TableName, Expand<Pick<Object, SelectedColumn>>[]> {
	readonly selectedColumns: SelectedColumn[] = []
	readonly orderItems: OrderItem<QueribleColumn>[] = []
	readonly table: TableName

	constructor(table: TableName, columns: SelectedColumn[]) {
		super()
		this.table = table
		this.selectedColumns = columns
	}

	get sql() {
		const args = this.whereItems.flatMap((items) => items.flatMap((i) => i.value))
		const sql =
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'} FROM ${
				this.table
			}` +
			this.whereClause +
			(this.orderItems.length > 0 ? '\nORDER BY ' + this.orderItems.join(',') : '')

		return { sql, args }
	}

	orderBy = (...keys: OrderItem<QueribleColumn>[]) => {
		this.orderItems.push(...keys)
		return this
	}

	run = async () => {
		const objects = await transaction((tx, resolve) => {
			const { sql, args } = this.sql
			tx.query(sql, args, resolve)
		})

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
> extends WhereQuery<TableName, void> {
	readonly table: TableName
	readonly object: Object

	constructor(table: TableName, object: Object) {
		super()
		this.table = table
		this.object = object
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
			this.whereClause

		args.push(...this.whereItems.flatMap((items) => items.flatMap((i) => i.value)))

		return { sql, args }
	}
}

export class DeleteQuery<TableName extends ShapeName> extends WhereQuery<TableName, void> {
	readonly table: TableName

	constructor(table: TableName) {
		super()
		this.table = table
	}

	get sql() {
		const args: any[] = this.whereItems.flatMap((items) => items.flatMap((i) => i.value))
		const sql = 'DELETE FROM ' + this.table + this.whereClause

		return { sql, args }
	}
}
