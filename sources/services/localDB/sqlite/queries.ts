import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import { PersistentShaped, ShapeName, Expand } from 'shared/types/primitives'
import { Querible, WhereItem, OrderItem, AllowedOperators, InferValue } from './types'
import { transaction } from './utils'
import { mapKeys } from 'shared/types/utils'

export class SelectQuery<
	SN extends ShapeName,
	SelectedColumn extends keyof Object,
	Object = PersistentShaped<SN>,
	QueribleObject = Querible<Object>,
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
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'} FROM ${this.table
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

	fetch = async (): Promise<Expand<Pick<Object, SelectedColumn>>[]> => {
		const objects = await transaction((tx, resolve) => {
			const { sql, args } = this.sql
			tx.query(sql, args, resolve)
		})

		const objectKeys = mapKeys(this.table, (key, type, flags) => {
			if (flags.includes('transient')
				|| typeof type !== 'object'
				|| (this.selectedColumns.length > 0 && !this.selectedColumns.includes(key as any))) return null
			return key
		})

		if (objectKeys.length > 0) {
			objects.forEach((o: any) =>
				objectKeys.forEach(k => {
					const value = o[k]
					if (value) o[k] = JSON.parse(value)
				})
			)
		}

		return objects
	}
}

export class InsertQuery<SN extends ShapeName, O = PersistentShaped<SN>> {
	readonly table: SN
	readonly objects: O[]

	constructor(table: SN, objects: O[]) {
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

	perform = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})
}
