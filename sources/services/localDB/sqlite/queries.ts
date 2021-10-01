import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import { PickPersistentObject, ShapeName } from 'shared/types/primitives'
import { Querible, WhereItem, OrderItem, AllowedOperators, InferValue } from './types'
import { transaction } from './utils'
import { mapKeys } from 'shared/types/utils'
import { Expand } from 'shared/utils'

export class SelectQuery<
	SN extends ShapeName,
	SelectedColumn extends keyof ResultObject,
	ResultObject = PickPersistentObject<SN>,
	QueribleObject = Querible<ResultObject>,
	QueribleColumn = keyof QueribleObject,
> {
	readonly selectedColumns: SelectedColumn[] = []
	readonly whereItems: WhereItem[][] = []
	readonly orderItems: OrderItem<QueribleColumn>[] = []
	readonly table: SN

	constructor(table: SN, columns: SelectedColumn[]) {
		this.table = table
		this.selectedColumns = columns
	}

	private get sql(): Query {
		const args = this.whereItems.flatMap((items) => items.flatMap((i) => i.value))
		const sql =
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'} FROM ${
				this.table
			}` +
			(this.whereItems.length > 0
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
				: '') +
			(this.orderItems.length > 0 ? ' ORDER BY ' + this.orderItems.join(',') : '')

		return { sql, args }
	}

	where = <
		K extends keyof QueribleObject,
		O extends AllowedOperators<QueribleObject[K]>,
		V extends QueribleObject[K],
		Value = InferValue<QueribleObject, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			or: this.orWhere,
			orderBy: this.orderBy,
			fetch: this.fetch,
		}
	}

	private orWhere = <
		K extends keyof QueribleObject,
		O extends AllowedOperators<QueribleObject[K]>,
		V extends QueribleObject[K],
		Value = InferValue<QueribleObject, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		getLast(this.whereItems)?.push({ key, operator, value })
		return {
			or: this.orWhere,
			orderBy: this.orderBy,
			fetch: this.fetch,
		}
	}

	private andWhere = <
		K extends keyof QueribleObject,
		O extends AllowedOperators<QueribleObject[K]>,
		V extends QueribleObject[K],
		Value = InferValue<QueribleObject, K, O, V>,
	>(
		key: K & string,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			orderBy: this.orderBy,
			fetch: this.fetch,
		}
	}

	orderBy = (...keys: OrderItem<QueribleColumn>[]) => {
		this.orderItems.push(...keys)
		return this
	}

	fetch = (): Promise<Expand<Pick<ResultObject, SelectedColumn>>[]> =>
		transaction((tx, resolve) => {
			const { sql, args } = this.sql
			tx.query(sql, args, resolve)
		})
}

export class InsertQuery<SN extends ShapeName, O = PickPersistentObject<SN>> {
	readonly table: SN
	readonly objects: O[]

	constructor(table: SN, objects: O[]) {
		this.table = table
		this.objects = objects
	}

	private get sql(): Query {
		const args: any[] = []
		const sql =
			`INSERT INTO ${this.table} VALUES ` +
			this.objects
				.map((o) => {
					return (
						'(' +
						mapKeys(this.table, (key, _, flags) => {
							if (flags.includes('transient')) return null
							// @ts-ignore
							const value = o[key] ?? ''
							args.push(value)
							return '?'
						}).join(',') +
						')'
					)
				})
				.join(',\n')

		return { sql, args }
	}

	perform = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}
