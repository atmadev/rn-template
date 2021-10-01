import { ShapeName, PersistentOnly, Shapes, Shaped } from 'shared/types/primitives'

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
export type InferValue<T, K extends keyof T, O extends Operator, V extends T[K]> = 
		O extends InOperator 			? V[]
	: O extends BetweenOperator ? [V, V]
	: O extends LikeOperator	  ? string
	: O extends IsOperator 			? IsValue
	: V

export type AllowedOperators<T> = T extends string
	? Operator
	: BasicOperator | BetweenOperator | InOperator | IsOperator

export type PersistentShape<S extends ShapeName> = PersistentOnly<Shapes[S]>
export type PersistentObject<SN extends ShapeName> = Shaped<PersistentShape<SN>>

export type SQLiteRowInfo = {
	cid: number
	name: string
	type: string
	notnull: boolean
	dflt_value: ColumnTypes | null
	pk: number
}
