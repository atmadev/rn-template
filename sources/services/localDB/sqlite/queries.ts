import { Query } from 'expo-sqlite'
import { getLast } from 'services/utils'
import {
	PersistentShaped,
	ShapeName,
	Expand,
	PrimaryPartialPersistentShaped,
} from 'shared/types/primitives'
import {
	WhereItem,
	OrderItem,
	AllowedOperators,
	InferValue,
	ArrayLimited,
	FilterValueTypes,
	AggregateItem,
	AggregateSingleItem,
	COUNT,
} from './types'
import { readTransaction, transaction } from './engine'
import { mapKeys } from 'shared/types/utils'

export class SelectQuery<
	TableName extends ShapeName,
	SelectedColumn extends keyof Object,
	Object = PersistentShaped<TableName>,
> {
	private readonly selectedColumns: SelectedColumn[] = []

	private readonly orderItems: OrderItem<Object>[] = []
	private readonly table: TableName

	constructor(table: TableName, columns: SelectedColumn[]) {
		this.table = table
		this.selectedColumns = columns
	}

	// prettier-ignore
	private sql = (limit?: number, offset?: number) => {
		const args = this.whereBuilder.args
		const sql =
			`SELECT ${this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*'} FROM ${this.table}` +
			this.whereBuilder.clause +
			(this.orderItems.length > 0 ? '\nORDER BY ' + this.orderItems.join(', ') : '') +
			(limit ? '\nLIMIT ' + limit + (offset ? ' OFFSET ' + offset : '') : '')

		return { sql, args }
	}

	orderBy = (...keys: OrderItem<Object>[]) => {
		this.orderItems.push(...keys)
		return { fetch: this.fetch }
	}

	fetch = async (
		limit?: number,
		offset?: number,
	): Promise<
		Expand<[SelectedColumn] extends [never] ? Object : Pick<Object, SelectedColumn>>[]
	> => {
		const objects = await readTransaction((tx, resolve) => {
			const { sql, args } = this.sql(limit, offset)
			tx.query(sql, args, resolve)
		})
		// const start = Date.now()
		const objectKeys = mapKeys(this.table, (key, { type, flags }) => {
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

export class AggregateQuery<
	TableName extends ShapeName,
	AggregateColumn extends AggregateItem<Object>,
	Object = PersistentShaped<TableName>,
> {
	private readonly selectedColumns: AggregateColumn[] = []
	private readonly table: TableName

	constructor(table: TableName, columns: AggregateColumn[]) {
		this.table = table
		this.selectedColumns = columns
	}

	private sql = () => ({
		sql: `SELECT ${this.selectedColumns.join(', ')} FROM ${this.table}` + this.whereBuilder.clause,
		args: this.whereBuilder.args,
	})

	// prettier-ignore
	fetch = async (): Promise<{
		[P in AggregateColumn]
			// eslint-disable-next-line no-unused-vars
			: P extends COUNT<infer _> ? number
			: P extends AggregateSingleItem<infer Key> ? Key extends keyof Object ? Object[Key] : never : never
	}> => {
		const { sql, args } = this.sql()
		const result = await readTransaction((tx, resolve) => tx.query(sql, args, resolve))
		return result[0]
	}

	private actions = { fetch: this.fetch }

	private readonly whereBuilder = new WhereBuilder<TableName, typeof this.actions>(this.actions)
	where = this.whereBuilder.where
	search = this.whereBuilder.search
	match = this.whereBuilder.match
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

		const columns = mapKeys(this.table, (key, { type, flags }) => {
			if (flags.includes('transient')) return null
			return { key, type }
		})
		// prettier-ignore
		const sql =
			'INSERT OR REPLACE INTO ' + this.table + '\n(' + columns.map(c => c.key).join(', ') + ') ' +
			'VALUES\n' + this.objects.map((o) => ('(' +
				columns.map(({ key, type }) => {
					// @ts-ignore
					const value = o[key]
					if (value !== null && value !== undefined) {
						args.push(typeof type === 'object' ? JSON.stringify(value) : value)
						return '?'
					} else return 'NULL'
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
				let valueSymbol
				if (v) {
					args.push(typeof v === 'object' ? JSON.stringify(v) : v)
					valueSymbol = '?'
				}
				else valueSymbol = 'NULL'
				return k + ' = ' + valueSymbol
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

export class UpdateMultipleQuery<
	TableName extends ShapeName,
	Object = PrimaryPartialPersistentShaped<TableName>,
> {
	readonly table: TableName
	readonly objects: Object[]

	constructor(table: TableName, objects: Object[]) {
		this.table = table
		this.objects = objects
	}

	get queries() {
		let primaryKey: string

		const allowedKeys = new Set(
			mapKeys(this.table, (key, { flags, primary }) => {
				if (primary) primaryKey = key
				if (flags.includes('transient') || primary) return null
				return key
			}),
		)
		// prettier-ignore
		return this.objects.map((object) => {
			const args = []
			const sql = 'UPDATE ' + this.table +' SET ' +
				Object.entries(object).filter(([k]) => allowedKeys.has(k)).map(([k, v]) => {
					let valueSymbol
					if (v) {
						args.push(typeof v === 'object' ? JSON.stringify(v) : v)
						valueSymbol = '?'
					} else valueSymbol = 'NULL'
					return k + ' = ' + valueSymbol
				}).join(', ') + ' WHERE ' + primaryKey + ' = ?'
			// @ts-ignore
			args.push(object[primaryKey])

			return { sql, args }
		})
	}

	run = (): Promise<void> =>
		transaction((tx) => this.queries.forEach(({ sql, args }) => tx.query(sql, args)))
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
			items.filter((i) => i.operator !== 'IS' && i.isArgKey === undefined).flatMap((i) => i.arg),
		)
	}

	// prettier-ignore
	get clause() {
		return this.items.length > 0 ?
			' WHERE ' + this.items.map((items) =>
				(items.length > 1 ? '(' : '') +
				items.map((i) =>
					i.key + ' ' + i.operator + ' ' + (i.isArgKey ? i.arg : (
					i.operator.includes('BETWEEN') ? '? AND ?' :
				 	i.operator.includes('IN') ? '(' + i.arg.map(() => '?').join(',') + ')' :
				  i.operator === 'IS' ? i.arg : '?'
				))).join(' OR ') +
				(items.length > 1 ? ')' : ''),
			).join(' AND ') : ''
	}

	where = <
		K extends keyof Object,
		O extends AllowedOperators<Object[K]>,
		V extends InferValue<Object, K, O>,
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Object ? true : undefined,
	) => {
		this.items.push([{ key: key as string, operator, arg, isArgKey }])
		return { and: this.andWhere, or: this.orWhere, ...this._actions }
	}

	private orWhere = <
		K extends keyof Object,
		O extends AllowedOperators<Object[K]>,
		V extends InferValue<Object, K, O>,
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Object ? true : undefined,
	) => {
		getLast(this.items)?.push({ key: key as string, operator, arg, isArgKey })
		return { or: this.orWhere, ...this._actions }
	}

	private andWhere = <
		K extends keyof Object,
		O extends AllowedOperators<Object[K]>,
		V extends InferValue<Object, K, O>,
	>(
		key: K,
		operator: O,
		arg: V,
		isArgKey?: V extends keyof Object ? true : undefined,
	) => {
		this.items.push([{ key: key as string, operator, arg, isArgKey }])
		return { and: this.andWhere, ...this._actions }
	}

	search = (
		string: string,
		...keys: ArrayLimited<keyof FilterValueTypes<Object, string | undefined | null>>
	) => {
		const subStrings = string.split(' ').filter((s) => s.length > 0)
		console.log('search', keys, subStrings)

		if (subStrings.length === 0) return this.actions

		subStrings.forEach((s) => {
			const items = keys.flatMap((key: any) => [
				{ key, operator: 'LIKE', arg: `${s}%` },
				{ key, operator: 'LIKE', arg: `${string}%` },
			])

			this.items.push(items as WhereItem[])
		})

		return this.actions
	}

	match = (object: Partial<Object>) => {
		Object.entries(object).forEach(([key, arg]) => this.items.push([{ key, operator: '=', arg }]))
		return this.actions
	}

	get actions() {
		return {
			where: this.where,
			...this._actions,
		}
	}
}
