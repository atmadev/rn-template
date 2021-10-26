import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import { PersistentShaped, ShapeName, Expand } from 'shared/types/primitives'
import { Querible, WhereItem, OrderItem, AllowedOperators, InferValue, Array1_5 } from './types'
import { readTransaction, transaction } from './engine'
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

	constructor(table: TableName, columns: SelectedColumn[]) {
		this.table = table
		this.selectedColumns = columns
	}

	// prettier-ignore
	private sql(limit?: number, offset?: number) {
		const args = this.whereBuilder.args
		// TODO: select all columns manually to prevent droppped columns fetching
		const sql =
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'}
			 FROM ${this.table}` +
			this.whereBuilder.clause +
			(this.orderItems.length > 0 ? '\nORDER BY ' + this.orderItems.join(', ') : '') +
			(limit ? '\nLIMIT ' + limit + (offset ? ' OFFSET ' + offset : '') : '')

		return { sql, args }
	}

	orderBy = (...keys: OrderItem<QueribleColumn>[]) => {
		this.orderItems.push(...keys)
		return { fetch: this.fetch }
	}

	fetch = async (
		limit?: number,
		offset?: number,
	): Promise<Expand<Pick<Object, SelectedColumn>>[]> => {
		const objects = await readTransaction((tx, resolve) => {
			const { sql, args } = this.sql(limit, offset)
			tx.query(sql, args, resolve)
		})

		// const start = Date.now()

		const objectKeys = mapKeys(this.table, (key, type, flags) => {
			if (
				flags.includes('transient') ||
				typeof type !== 'object' ||
				(this.selectedColumns.length > 0 && !this.selectedColumns.includes(key as any))
			)
				return null
			return key
		})

		if (objectKeys.length > 0)
			objects.forEach((o: any) =>
				objectKeys.forEach((k) => (o[k] ? (o[k] = JSON.parse(o[k])) : null)),
			)
		// console.log('Mapping time', Date.now() - start)
		return objects
	}

	private actions = { fetch: this.fetch, orderBy: this.orderBy }

	private readonly whereBuilder = new WhereBuilder<TableName, typeof this.actions>(this.actions)
	where = this.whereBuilder.where
	search = this.whereBuilder.search
	match = this.whereBuilder.match
}

type FilterType<T, F> = { [K in keyof T as T[K] extends F ? K : never]: T[K] }

export class InsertQuery<TableName extends ShapeName, Object = PersistentShaped<TableName>> {
	readonly table: TableName
	readonly objects: Object[]

	constructor(table: TableName, objects: Object[]) {
		this.table = table
		this.objects = objects
	}

	private get sql(): Query {
		const args: any[] = []

		const columns = mapKeys(this.table, (key, type, flags) => {
			if (flags.includes('transient')) return null
			return { key, type }
		})
		// prettier-ignore
		const sql =
			'INSERT OR REPLACE INTO ' + this.table + '\n(' + columns.map(c => c.key).join(', ') + ') ' +
			'VALUES\n' + this.objects.map((o) => ('(' +
				columns.map(({ key, type }) => {
					// @ts-ignore
					const value = o[key] ?? ''
					args.push(typeof type === 'object' ? JSON.stringify(value) : value)
					return '?'
				}).join(',') +
				')')).join(',\n')

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

	constructor(table: TableName, object: Object) {
		this.table = table
		this.object = object
	}

	get sql() {
		const args: any[] = []
		// prettier-ignore
		const sql = 'UPDATE ' + this.table + ' SET ' +
			Object.entries(this.object).map(([k, v]) => {
				args.push(typeof v === 'object' ? JSON.stringify(v) : v)
				return k + ' = ?'
			}).join(', ') +
			this.whereBuilder.clause

		args.push(...this.whereBuilder.args)
		return { sql, args }
	}

	run = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})

	private actions = { run: this.run }

	private readonly whereBuilder = new WhereBuilder<TableName, typeof this.actions>(this.actions)
	where = this.whereBuilder.where
	match = this.whereBuilder.match
}

export class DeleteQuery<TableName extends ShapeName> {
	readonly table: TableName

	constructor(table: TableName) {
		this.table = table
	}

	get sql() {
		const args: any[] = this.whereBuilder.args
		const sql = 'DELETE FROM ' + this.table + this.whereBuilder.clause

		return { sql, args }
	}

	run = async (): Promise<void> =>
		transaction((tx) => {
			const { sql, args } = this.sql
			tx.query(sql, args)
		})

	private actions = { run: this.run }

	private readonly whereBuilder = new WhereBuilder<TableName, typeof this.actions>(this.actions)
	where = this.whereBuilder.where
	match = this.whereBuilder.match
}

class WhereBuilder<TableName extends ShapeName, Actions, Object = PersistentShaped<TableName>> {
	readonly items: WhereItem[][] = []
	private readonly _actions: Actions

	constructor(actions: Actions) {
		this._actions = actions
	}

	get args() {
		return this.items.flatMap((items) =>
			items.filter(i => i.operator !== 'IS' && i.isArgKey === undefined).flatMap((i) => i.arg),
		)
	}

	// prettier-ignore
	get clause() {
		return this.items.length > 0 ?
			' WHERE ' + this.items.map((items) =>
				(items.length > 1 ? '(' : '') +
				items.map((i) =>
					i.key + ' ' + i.operator + ' ' + i.isArgKey ? + i.arg : (
						i.operator.includes('BETWEEN') ? '? AND ?' :
							i.operator.includes('IN') ? '(' + i.arg.map(() => '?').join(',') + ')' :
								i.operator === 'IS' ? i.arg : '?'
					)).join(' OR ') +
				(items.length > 1 ? ')' : ''),
			).join(' AND ') : ''
	}

	where = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends InferValue<Querible<Object>, K, O>
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Querible<Object> ? true : undefined
	) => {
		this.items.push([{ key: key as string, operator, arg, isArgKey }])
		return {
			and: this.andWhere,
			or: this.orWhere,
			...this._actions,
		}
	}

	private orWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends InferValue<Querible<Object>, K, O>
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Querible<Object> ? true : undefined
	) => {
		getLast(this.items)?.push({ key: key as string, operator, arg, isArgKey })
		return {
			or: this.orWhere,
			...this._actions,
		}
	}

	private andWhere = <
		K extends keyof Querible<Object>,
		O extends AllowedOperators<Querible<Object>[K]>,
		V extends InferValue<Querible<Object>, K, O>
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Querible<Object> ? true : undefined
	) => {
		this.items.push([{ key: key as string, operator, arg, isArgKey }])
		return {
			and: this.andWhere,
			...this._actions,
		}
	}

	search = (
		string: string,
		...keys: Array1_5<keyof FilterType<Querible<Object>, string | undefined>>
	) => {
		const subStrings = string.split(' ').filter((s) => s.length > 0)

		if (subStrings.length === 0) return this.actions

		subStrings.forEach((s) =>
			this.items.push(keys.map((key: any) => ({ key, operator: 'LIKE', arg: `${s}%` }))),
		)

		return this.actions
	}

	match = (object: Partial<Querible<Object>>) => {
		Object.entries(object).forEach(([key, arg]) =>
			this.items.push([{ key, operator: '=', arg }]),
		)
		return this.actions
	}

	get actions() {
		return {
			where: this.where,
			...this._actions
		}
	}
}
