import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import {
	OnlyAllowedTypes,
	WhereItem,
	OrderItem,
	AllowedOperators,
	InferValue,
	Operator,
} from './types'
import { transaction } from './utils'

export class SelectQuery<A, T = OnlyAllowedTypes<A>> {
	columns: (keyof T)[] = []
	private readonly whereItems: WhereItem<T>[][] = []
	private readonly orderItems: OrderItem<T>[] = []
	private readonly table: string

	constructor(table: string, columns: (keyof T)[]) {
		this.table = table
		this.columns = columns
	}

	private get sql(): Query {
		const args = this.whereItems.flatMap((items) => items.flatMap((i) => i.value))
		const sql =
			`SELECT ${this.columns.length > 0 ? this.columns.join(',') : '*'} FROM ${this.table}` +
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
		K extends keyof T,
		O extends AllowedOperators<T[K]>,
		V extends T[K],
		Value = InferValue<T, K, O, V>,
	>(
		key: K,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			or: this.orWhere,
			orderBy: this.orderBy,
		}
	}

	private orWhere = <
		K extends keyof T,
		O extends Operator,
		V extends T[K],
		Value = InferValue<T, K, O, V>,
	>(
		key: K,
		operator: O,
		value: Value,
	) => {
		getLast(this.whereItems)?.push({ key, operator, value })
		return {
			or: this.orWhere,
			orderBy: this.orderBy,
			structured: this.sql,
		}
	}

	private andWhere = <
		K extends keyof T,
		O extends Operator,
		V extends T[K],
		Value = InferValue<T, K, O, V>,
	>(
		key: K,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			orderBy: this.orderBy,
			structured: this.sql,
		}
	}

	orderBy = (...keys: OrderItem<T>[]) => {
		this.orderItems.push(...keys)
		return this
	}

	fetch = async (): Promise<T[]> =>
		transaction((tx, resolve) => {
			const { sql, args } = this.sql
			tx.query(sql, args, (_, array) => resolve(array))
		})
}
