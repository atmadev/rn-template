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

type NotNullOrderItem<Key> = Key | `${string & Key} DESC`

type NullableOrderModifier = 'DESC' | 'NULLS LAST' | 'DESC NULLS FIRST'
type NullableOrderItem<Key> = Key | `${string & Key} ${string & NullableOrderModifier}`

export type OrderItem<T> = {
	[K in keyof T]-?: IsContain<T[K], undefined, NullableOrderItem<K>, NotNullOrderItem<K>>
}[keyof T]

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

export type IsContain<T, S, YES, NO> = Extract<T, S> extends never ? NO : YES
export type ExtractAndMap<T, S, MAP> = IsContain<T, S, MAP, never>

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
		primaryKey?: keyof Querible<PersistentShaped<SN>>
		unique?: NotNullOrderItem<keyof Querible<PersistentShaped<SN>>>[][]
		index?: NotNullOrderItem<keyof Querible<PersistentShaped<SN>>>[][]
		namesHistory?: {
			// eslint-disable-next-line no-unused-vars
			[_ in keyof PersistentShaped<SN>]?: string[]
		}
	}
}

export type Array1_5<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T] | [T, T, T, T, T]
