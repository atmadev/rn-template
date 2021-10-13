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

export type OrderItem<Key> = Key | `${string & Key} DESC`

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

export type SQLiteRowInfo = {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}

export type SQLiteIndexInfo = {
	name: string
	origin: 'c' | 'u'
	partial: boolean
	seq: number
	unique: boolean
}
