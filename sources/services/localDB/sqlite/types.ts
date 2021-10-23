import { PersistentShaped, ShapeName } from 'shared/types/primitives'

type Notted<T extends string> = T | `NOT ${T}`

type ComparsionOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
type BetweenOperator = Notted<'BETWEEN'>
type InOperator = Notted<'IN'>
type RangeOperator = BetweenOperator | InOperator
type BasicOperator = ComparsionOperator | RangeOperator
type LikeOperator = Notted<'LIKE'>
type IsOperator = 'IS'
type IsValue = Notted<'NULL'>
type Operator = ComparsionOperator | InOperator | LikeOperator | BetweenOperator | IsOperator
export type ColumnTypes = number | string | boolean

export type Querible<T> = {
	[P in keyof T as T[P] extends ColumnTypes | undefined ? P : never]: T[P]
}

export type WhereItem = {
	key: string
	operator: Operator
	value: any
}

type OrderModifier = 'DESC' | 'NULL LAST' | 'DESC NULL FIRST'

export type OrderItem<Key> = Key | `${string & Key} ${string & OrderModifier}`

type IndexItem<Key> = Key | `${string & Key} DESC`

// prettier-ignore
export type InferValue<T, K extends keyof T, O extends Operator, V = Exclude<T[K], undefined>> =
	O extends InOperator ? V[]
	: O extends BetweenOperator ? [V, V]
	: O extends LikeOperator ? string
	: O extends IsOperator ? IsValue
	: V

type MapExtract<T, S, MAP> = Extract<T, S> extends never ? never : MAP

// prettier-ignore
export type AllowedOperators<T> =
	MapExtract<T, undefined, IsOperator>
	| MapExtract<T, string, BasicOperator | LikeOperator>
	| MapExtract<T, boolean, '='>
	| MapExtract<T, number, BasicOperator>

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
