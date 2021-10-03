import { shapes } from './shapes'

export type Flag = 'required' | 'indexed' | 'unique' | 'transient' | 'local'

export type TypeInternal = PrimitiveType | Shape
export type Type = TypeInternal | TypeInternal[]

export type ShapeItem = {
	type: Type
	readonly flags: readonly Flag[]
}

export type Shape = {
	[key: string]: ShapeItem | Type
}

export type PrimitiveTypeMap = {
	string: string
	number: number
	boolean: boolean
}

export const primitiveTypes = {
	string: 'string' as const,
	number: 'number' as const,
	boolean: 'boolean' as const,
}

export type PrimitiveType = keyof typeof primitiveTypes

// prettier-ignore
type ShapedItem<T extends Type> =
	T extends PrimitiveType ? PrimitiveTypeMap[T]
	: T extends PrimitiveType[] ? PrimitiveTypeMap[T[number]][]
	: T extends Shape ? _Shaped<T>
	: T extends Shape[] ? _Shaped<T[number]>[]
	: never

type ExtractFlag<I extends ShapeItem, F extends Flag> = Extract<I['flags'][number], F>
type IfFlag<I extends ShapeItem, F extends Flag, YES, NO> = ExtractFlag<I, F> extends never ? NO : YES

type IsRequired<I, YES, NO> = I extends ShapeItem ? IfFlag<I, 'required', YES, NO> : NO
type IsPersistent<I, YES, NO> = I extends ShapeItem ? IfFlag<I, 'transient', NO, YES> : YES

// prettier-ignore
type ShapedInternal<S extends Shape | Shape[]> = {
	[K in keyof S]
	: S[K] extends PrimitiveType ? PrimitiveTypeMap[S[K]] 					// string,   boolean,   number
	: S[K] extends PrimitiveType[] ? PrimitiveTypeMap[S[K][number]][] // string[], boolean[], number[]
	: S[K] extends ShapeItem ? Expand<ShapedItem<S[K]['type']>>
	: S[K] extends Shape ? Expand<_Shaped<S[K]>>
	: S[K] extends Shape[] ? Expand<_Shaped<S[K][number]>>[]
	: never
}

type RequiredOnly<S extends Shape> = {
	[K in keyof S as IsRequired<S[K], K, never>]: S[K]
}


type _Shaped<S extends Shape | Shape[]> = Expand<
	Partial<ShapedInternal<S>> & (S extends Shape ? ShapedInternal<RequiredOnly<S>> : {})
>

type _PersistentShaped<S extends Shape> = _Shaped<{
	[K in keyof S as IsPersistent<S[K], K, never>]: S[K]
}>

export type Shapes = typeof shapes
export type ShapeName = keyof Shapes

export type Shaped<SN extends ShapeName> = _Shaped<Shapes[SN]>
export type PersistentShaped<SN extends ShapeName> = _PersistentShaped<Shapes[SN]>

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
export type StringKeys = { [key: string]: any }
