import { openDatabase, Query as StructuredQuery } from 'expo-sqlite'
import { Profile } from 'shared/types'

const db = openDatabase('db')

type Notted<T extends string> = T | `NOT ${T}`

type BasicOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
type BetweenOperator = Notted<'BETWEEN'>
type InOperator = Notted<'IN'>
type LikeOperator = Notted<'LIKE'>
type IsOperator = 'IS'
type IsValue = Notted<'NULL'>
type Operator = BasicOperator | InOperator | LikeOperator | BetweenOperator | IsOperator
type ColumnTypes = number | string | boolean

type OnlyAllowedTypes<T> = { [P in keyof T as T[P] extends ColumnTypes ? P : never]: T[P] }

type WhereItem<T> = {
	key: keyof T
	operator: Operator
	value: any
}

type OrderItem<Type> = keyof Type | `${string & keyof Type} DESC`

class SelectQuery<A, T = OnlyAllowedTypes<A>> {
	columns: (keyof T)[] = []
	private readonly whereItems: WhereItem<T>[] = []
	private readonly orderItems: OrderItem<T>[] = []
	private readonly table: string

	constructor(table: string, columns: (keyof T)[]) {
		this.table = table
		this.columns = columns
	}

	private get structured(): StructuredQuery {
		const args = this.whereItems.flatMap((i) => i.value)
		const sql =
			`SELECT ${this.columns.length > 0 ? this.columns.join(',') : '*'} FROM ${this.table}` +
			(this.whereItems.length > 0
				? ' WHERE ' +
				  this.whereItems
						.map((i) => {
							const string = i.key + ' ' + i.operator + ' '
							if (i.operator.includes('BETWEEN')) return string + '? AND ?'
							else if (i.operator.includes('IN')) return string + "('" + i.value.map(() => '?').join("', '") + "')"
							else if (i.operator.includes('LIKE')) return string + "'?'"
							else if (i.operator === 'IS') return string + i.value
							else return string + '?'
						})
						.join(' AND ')
				: '') +
			(this.orderItems.length > 0 ? ' ORDER BY ' + this.orderItems.join(', ') : '')

		return { sql, args }
	}

	where = <K extends keyof T, O extends Operator, V extends T[K]>(
		key: K,
		operator: O,
		value: O extends InOperator
			? V[]
			: O extends BetweenOperator
			? [V, V]
			: O extends LikeOperator
			? string
			: O extends IsOperator
			? IsValue
			: V,
	) => {
		this.whereItems.push({ key, operator, value })
		return this
	}

	orderBy = (...keys: OrderItem<T>[]) => {
		this.orderItems.push(...keys)
		return this
	}
}

class Table<T> {
	name: string
	constructor(name: string) {
		this.name = name
	}

	// insert = (object: T) => new InsertQuery(this.name, Object.keys(object))
	select = (...columns: (keyof T)[]) => new SelectQuery(this.name, columns)
	update = () => {}
	delete = () => {}
}

// TODO: test SQL again

const t = new Table<Profile>('profile')
t.select('firstName', 'id')
	.where('firstName', 'LIKE', 's%')
	.where('age', '>=', 22)
	.where('age', 'NOT BETWEEN', [1, 2])
	.where('lastName', 'IN', ['Alex', 'Julia', 'Liana'])
	.where('male', '=', true)
	.where('id', '=', 'ffew')
	.where('lastName', 'IS', 'NOT NULL')
	.orderBy('interests DESC', 'firstName', 'lastName DESC', 'interests')

/*
	//TODO: Use shapes in SQL to specify columns before insert

class InsertQuery<A, T = OnlyAllowedTypes<A>> {
	columns: (keyof T)[] = []
	private readonly table: string
	private readonly object: T

	constructor(table: string, object: T) {
		this.table = table
		this.object = object
	}

	private get structured(): StructuredQuery {
		const args = [] // TODO: implement this.whereItems.flatMap((i) => i.value)
		const sql =
			`INSERT INTO ${this.table} ${this.columns.length > 0 ? '(' + this.columns.join(',') + ')' : ''}` +
			(this.whereItems.length > 0
				? ' WHERE ' +
				  this.whereItems
						.map((i) => {
							const string = i.key + ' ' + i.operator + ' '
							if (i.operator.includes('BETWEEN')) return string + '? AND ?'
							else if (i.operator.includes('IN')) return string + "('" + i.value.map(() => '?').join("', '") + "')"
							else if (i.operator.includes('LIKE')) return string + "'?'"
							else if (i.operator === 'IS') return string + i.value
							else return string + '?'
						})
						.join(' AND ')
				: '') +
			(this.orderItems.length > 0 ? ' ORDER BY ' + this.orderItems.join(', ') : '')

		return { sql, args }
	}

	where = <K extends keyof T, O extends Operator, V extends T[K]>(
		key: K,
		operator: O,
		value: O extends InOperator
			? V[]
			: O extends BetweenOperator
			? [V, V]
			: O extends LikeOperator
			? string
			: O extends IsOperator
			? IsValue
			: V,
	) => {
		this.whereItems.push({ key, operator, value })
		return this
	}
}
*/
