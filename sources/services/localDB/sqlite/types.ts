import { PersistentShaped, ShapeName } from 'shared/types/primitives'

type NOT<T extends string> = T | `NOT ${T}`

type ComparsionOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
type BETWEEN = NOT<'BETWEEN'>
type IN = NOT<'IN'>
type RangeOperator = BETWEEN | IN
type BasicOperator = ComparsionOperator | RangeOperator
type LIKE = NOT<'LIKE'>
type IS = 'IS'
type IsValue = NOT<'NULL'>
type Operator = ComparsionOperator | IN | LIKE | BETWEEN | IS
export type ColumnTypes = number | string | boolean

export type Querible<T> = {
	[P in keyof T as T[P] extends ColumnTypes | undefined ? P : never]: T[P]
}

export type WhereItem = {
	key: string
	operator: Operator
	arg: any
	isArgKey?: true
}

type OrderModifier = 'DESC' | 'NULL LAST' | 'DESC NULL FIRST'

export type OrderItem<Key> = Key | `${string & Key} ${string & OrderModifier}`

type IndexItem<Key> = Key | `${string & Key} DESC`

// prettier-ignore
export type InferValue<T, K extends keyof T, O extends Operator, V = Exclude<T[K], undefined>> =
	O extends IN ? V[]
	: O extends BETWEEN ? [V, V]
	: O extends LIKE ? string
	: O extends IS ? IsValue
	: V | keyof FilterValueTypes<T, V | undefined>

export type FilterValueTypes<O, T> = {
	[K in keyof O as O[K] extends T ? K : never]: O[K]
}

type ExtractAndMap<T, S, MAP> = Extract<T, S> extends never ? never : MAP

// prettier-ignore
export type AllowedOperators<T> =
	ExtractAndMap<T, undefined, IS>
	| ExtractAndMap<T, string, BasicOperator | LIKE>
	| ExtractAndMap<T, boolean, '='>
	| ExtractAndMap<T, number, BasicOperator>

export type SQLColumnInfo = {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}

export type SQLIndexInfo = {
	name: string
	origin: 'c' | 'u' | 'pk'
	partial: 0 | 1
	seq: number
	unique: 0 | 1
}

export type SQLSchema<ShapeNames extends ShapeName> = {
	[SN in ShapeNames]: {
		primaryKey?: keyof PersistentShaped<SN>
		unique?: IndexItem<keyof PersistentShaped<SN>>[][]
		index?: IndexItem<keyof PersistentShaped<SN>>[][]
		namesHistory?: {
			// eslint-disable-next-line no-unused-vars
			[_ in keyof PersistentShaped<SN>]?: string[]
		}
	}
}

export type Array1_5<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T] | [T, T, T, T, T]
