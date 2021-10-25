import { shapes } from './'

export type Flag = 'transient' | 'local'

export type PrimitiveTypeMap = {
	_string: string
	_number: number
	_boolean: boolean
	_any: any
	_true: true
}

export const primitiveTypes = {
	string: '_string' as const,
	number: '_number' as const,
	boolean: '_boolean' as const,
	any: '_any' as const,
	TRUE: '_true' as const,
}

export type PrimitiveType = keyof PrimitiveTypeMap

export type TypeInternal = PrimitiveType | Shape
export type Type = TypeInternal | TypeInternal[]

export type ShapeItem = {
	_shapeItem: true
	type: Type
	readonly flags: readonly Flag[]
}

export type RequiredShapeItem = ShapeItem & { required: true }

export type Shape = { [key: string]: ShapeItem | Type }

// prettier-ignore
type ShapedItem<T extends Type> =
	T extends { _string: infer T } ? T extends Type ? Record<string, ShapedItem<T>> : never
	: T extends PrimitiveType ? PrimitiveTypeMap[T]
	: T extends PrimitiveType[] ? PrimitiveTypeMap[T[number]][]
	: T extends Shape ? _Shaped<T>
	: T extends Shape[] ? _Shaped<T[number]>[] : never

type ExtractFlag<I extends ShapeItem, F extends Flag> = Extract<I['flags'][number], F>
// prettier-ignore
type IfFlag<I extends ShapeItem, F extends Flag, YES, NO> = ExtractFlag<I, F> extends never ? NO : YES

type IsRequired<I, YES, NO> = I extends RequiredShapeItem ? YES : NO
type IsPersistent<I, YES, NO> = I extends ShapeItem ? IfFlag<I, 'transient', NO, YES> : YES

// prettier-ignore
type ShapedInternal<S extends Shape | Shape[]> = { [K in keyof S]
	: S[K] extends ShapeItem ? ShapedItem<S[K]['type']>
	: S[K] extends Type ? ShapedItem<S[K]> : never
}

type _Shaped<S extends Shape | Shape[]> = Partial<ShapedInternal<S>> &
	(S extends Shape ? ShapedInternal<RequiredOnly<S>> : {})
// prettier-ignore
type _PersistentShaped<S extends Shape> = _Shaped<{
	[K in keyof S as IsPersistent<S[K], K, never>]: S[K]
}>

type RequiredOnly<S extends Shape> = {
	[K in keyof S as IsRequired<S[K], K, never>]: S[K]
}

export type Shapes = typeof shapes
export type ShapeName = keyof Shapes

export type Shaped<SN extends ShapeName> = _Shaped<Shapes[SN]>
export type PersistentShaped<SN extends ShapeName> = _PersistentShaped<Shapes[SN]>

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
export type ExpandDeep<T> = T extends object
	? T extends infer O
	? { [K in keyof O]: ExpandDeep<O[K]> }
	: never
	: T

export const TRUE = true as const
export const FALSE = false as const
