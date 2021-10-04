type Notted<T extends string> = T | `NOT ${T}`

type ComparsionPredicate = '=' | '>' | '<' | '>=' | '<=' | '<>'
type BetweenPredicate = Notted<'BETWEEN'>
type InPredicate = Notted<'IN'>
type RangePredicate = BetweenPredicate | InPredicate
type BasicPredicate = ComparsionPredicate | RangePredicate
type LikePredicate = Notted<'LIKE'>
type IsPredicate = 'IS'
type IsValue = Notted<'NULL'>
type Predicate = ComparsionPredicate | InPredicate | LikePredicate | BetweenPredicate | IsPredicate
export type ColumnTypes = number | string | boolean

export type Querible<T> = {
	[P in keyof T as T[P] extends ColumnTypes | undefined ? P : never]: T[P]
}

export type WhereItem = {
	key: string
	predicate: Predicate
	value: any
}

export type OrderItem<Key> = Key | `${string & Key} DESC`

// prettier-ignore
export type InferValue<T, K extends keyof T, P extends Predicate, V = Exclude<T[K], undefined>> =
	P extends InPredicate ? V[]
	: P extends BetweenPredicate ? [V, V]
	: P extends LikePredicate ? string
	: P extends IsPredicate ? IsValue
	: V

type HasType<T, S, YES, NO> = Extract<T, S> extends never ? NO : YES

// prettier-ignore
export type AllowedPredicates<T> =
  	HasType<T, undefined, IsPredicate, never> 
	| HasType<T, string, BasicPredicate | LikePredicate, never> 
	| HasType<T, boolean, '=', never> 
	| HasType<T, number, BasicPredicate, never>

export type SQLiteRowInfo = {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}
