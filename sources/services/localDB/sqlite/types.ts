type Notted<T extends string> = T | `NOT ${T}`

export type BasicOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
export type BetweenOperator = Notted<'BETWEEN'>
export type InOperator = Notted<'IN'>
export type LikeOperator = Notted<'LIKE'>
export type IsOperator = 'IS'
export type IsValue = Notted<'NULL'>
export type Operator = BasicOperator | InOperator | LikeOperator | BetweenOperator | IsOperator
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

type HasType<T, S, YES, NO> = Extract<T, S> extends never ? NO : YES

// prettier-ignore
export type AllowedOperators<T> =
  	HasType<T, undefined, IsOperator, never> 
	| HasType<T, string, BasicOperator | InOperator | LikeOperator | BetweenOperator, never> 
	| HasType<T, boolean, '=', never> 
	| HasType<T, number, BasicOperator | BetweenOperator | InOperator, never>

export type SQLiteRowInfo = {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}
