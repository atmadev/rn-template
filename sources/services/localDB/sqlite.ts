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
type Order = 'ASC' | 'DESC'

type OnlyAllowedTypes<T> = { [P in keyof T as T[P] extends ColumnTypes ? P : never]: T[P] }

type WhereItem<T> = {
	key: keyof T
	operator: Operator
	value: any
}

type OrderItem<T> = {
	key: keyof T
	order?: Order
}

class SelectQuery<A, T = OnlyAllowedTypes<A>> {
	columns: (keyof T)[] = []
	private readonly whereItems: WhereItem<T>[] = []
	readonly orderItems: OrderItem<T>[] = []
	readonly table: string

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
			(this.orderItems.length > 0
				? ' ORDER BY ' + this.orderItems.map((i) => i.key + (i.order ? ' ' + i.order : '')).join(', ')
				: '')

		return { sql, args }
	}

	where = <P extends keyof T, O extends Operator, V extends T[P]>(
		key: P,
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
		return { and: this.where }
	}

	orderBy = (key: keyof T, order?: Order) => this.orderItems.push({ key, order })
}

class InsertQuery<A, T = OnlyAllowedTypes<A>> {
	private readonly columns: (keyof T)[] = []
	private readonly whereItems: WhereItem<T>[] = []
	readonly orderItems: OrderItem<T>[] = []
	readonly table: string

	constructor(table: string, object: T) {
		this.table = table
		// this.columns = Object.keys(object)
		// TODO: implement
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
			(this.orderItems.length > 0
				? ' ORDER BY ' + this.orderItems.map((i) => i.key + (i.order ? ' ' + i.order : '')).join(', ')
				: '')

		return { sql, args }
	}

	where = <P extends keyof T, O extends Operator, V extends T[P]>(
		key: P,
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
		return { and: this.where }
	}

	orderBy = (key: keyof T, order?: Order) => this.orderItems.push({ key, order })
}

class Table<T> {
	name: string
	constructor(name: string) {
		this.name = name
	}

	insert = (object: T) => new InsertQuery(this.name, Object.keys(object))
	select = (...columns: (keyof T)[]) => new SelectQuery(this.name, columns)
	update = () => {}
	delete = () => {}
}

const t = new Table<Profile>('profile')
t.select('firstName', 'id')
	.where('firstName', 'LIKE', 's%')
	.and('age', '>=', 22)
	.and('age', 'NOT BETWEEN', [1, 2])
	.and('lastName', 'IN', ['Alex', 'Julia', 'Liana'])
	.and('male', '=', true)
	.and('id', '=', 'ffew')
	.and('lastName', 'IS', 'NOT NULL')
