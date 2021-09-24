import { openDatabase, Query as StructuredQuery } from 'expo-sqlite'
import { PickShape } from 'shared/types/primitives'
import * as shapes from 'shared/types/shapes'
import { getLast } from '../utils'

type Shapes = typeof shapes

const sqlite = openDatabase('db')

export const setupDBForShapes = (...shapeNames: (keyof Shapes)[]) => {
	for (const shapeName of shapeNames) {
		// create JS table for each shape

		// create SQLite table for each shape
		// validate are all fields presented in the SQLite
		const shape = shapes[shapeName]
	}

	// return DB object with JS tables
}

class Table<N extends keyof Shapes, T = PickShape<N>> {
	readonly name: N
	constructor(name: N) {
		this.name = name
	}

	// insert = (object: T) => new InsertQuery(this.name, Object.keys(object))
	select = (...columns: (keyof T)[]) => new SelectQuery(this.name, columns)
	update = () => {}
	delete = () => {}
}

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

// prettier-ignore
type InferValue<T, K extends keyof T, O extends Operator, V extends T[K]> = 
		O extends InOperator 			? V[]
	: O extends BetweenOperator ? [V, V]
	: O extends LikeOperator	  ? string
	: O extends IsOperator 			? IsValue
	: V

type AllowedOperators<T> = T extends string ? Operator : BasicOperator | BetweenOperator | InOperator | IsOperator

class SelectQuery<A, T = OnlyAllowedTypes<A>> {
	columns: (keyof T)[] = []
	private readonly whereItems: WhereItem<T>[][] = []
	private readonly orderItems: OrderItem<T>[] = []
	private readonly table: string

	constructor(table: string, columns: (keyof T)[]) {
		this.table = table
		this.columns = columns
	}

	private get structured(): StructuredQuery {
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
										else if (i.operator.includes('IN')) return string + '(' + i.value.map(() => '?').join(',') + ')'
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

	where = <K extends keyof T, O extends AllowedOperators<T[K]>, V extends T[K], Value = InferValue<T, K, O, V>>(
		key: K,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			or: this.orWhere,
			orderBy: this.orderBy,
			structured: this.structured,
		}
	}

	private orWhere = <K extends keyof T, O extends Operator, V extends T[K], Value = InferValue<T, K, O, V>>(
		key: K,
		operator: O,
		value: Value,
	) => {
		getLast(this.whereItems)?.push({ key, operator, value })
		return {
			or: this.orWhere,
			orderBy: this.orderBy,
			structured: this.structured,
		}
	}

	private andWhere = <K extends keyof T, O extends Operator, V extends T[K], Value = InferValue<T, K, O, V>>(
		key: K,
		operator: O,
		value: Value,
	) => {
		this.whereItems.push([{ key, operator, value }])
		return {
			and: this.andWhere,
			orderBy: this.orderBy,
			structured: this.structured,
		}
	}

	orderBy = (...keys: OrderItem<T>[]) => {
		this.orderItems.push(...keys)
		return this
	}
}

const t = new Table('Profile')
const q = t.select('firstName', 'id')

q.where('firstName', 'LIKE', 's%')
	.and('age', '>=', 22)
	.and('age', 'NOT BETWEEN', [1, 2])
	.and('lastName', 'IN', ['Alex', 'Julia', 'Liana'])
	.and('male', '=', true)
	.and('id', '=', 'ffew')
	.and('lastName', 'IS', 'NOT NULL')

q.where('lastName', 'LIKE', 's%')
	.or('lastName', 'LIKE', '% s%')
	.or('firstName', 'LIKE', 's%')
	.or('firstName', 'LIKE', '% s%')

q.where('firstName', 'LIKE', 'Valera').and('age', '>', 12)

q.orderBy('interests DESC', 'firstName', 'lastName DESC', 'interests')

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
}
*/
