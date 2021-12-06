import {
	ExcludeAndMap,
	ExtractAndMap,
	IsContain,
	PersistentShaped,
	ShapeName,
} from 'shared/types/primitives'

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

export interface WhereItem {
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

export type FilterValueTypes<O, V> = {
	[K in keyof O as O[K] extends V ? K : never]: O[K]
}

// prettier-ignore
export type AllowedOperators<T> =
	ExtractAndMap<T, undefined, IS>
	| ExtractAndMap<T, string, BasicOperator | LIKE>
	| ExtractAndMap<T, boolean, '='>
	| ExtractAndMap<T, number, BasicOperator>

type DISTINCT<K extends string> = K | `DISTINCT ${K}`
export type COUNT<K extends string> = `COUNT(${DISTINCT<K>})`
// prettier-ignore
type GROUP_CONCAT<K extends string> = `GROUP_CONCAT(${DISTINCT<K> | `${K}, '${string}'`})`
// prettier-ignore
export type AggregateItem<T> = {
		[K in keyof T]: K extends string ?
		  	ExtractAndMap<T[K], number, ExcludeAndMap<T[K], undefined, `SUM(${K})`>
															  	| `${'AVG' | 'MAX' | 'MIN' | 'TOTAL'}(${K})`>
			| ExtractAndMap<T[K], string, `${'MAX' | 'MIN'}(${K})` | GROUP_CONCAT<K>>
			| ExtractAndMap<T[K], undefined, COUNT<K>>
		: never
	}[keyof T] | COUNT<'*'>
// prettier-ignore
export type AggregateSingleItem<K extends string> = `${'AVG' | 'MAX' | 'MIN' | 'TOTAL' | 'SUM'}(${K})` | COUNT<K> | GROUP_CONCAT<K>

export interface SQLColumnInfo {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}

export interface SQLIndexInfo {
	name: string
	origin: 'c' | 'u' | 'pk'
	partial: 0 | 1
	seq: number
	unique: 0 | 1
}

export type SQLSchema<ShapeNames extends ShapeName> = {
	[SN in ShapeNames]: {
		unique?: NotNullOrderItem<keyof Querible<PersistentShaped<SN>>>[][]
		index?: NotNullOrderItem<keyof Querible<PersistentShaped<SN>>>[][]
		columnNamesHistory?: {
			// eslint-disable-next-line no-unused-vars
			[_ in keyof PersistentShaped<SN>]?: string[]
		}
		tableNamesHistory?: string[]
	}
}

export type ArrayLimited<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T] | [T, T, T, T, T]

export interface SQLDatabaseInfo {
	file: string
	name: string
	seq: number
}
