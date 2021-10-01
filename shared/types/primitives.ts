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
		T extends PrimitiveType   ? PrimitiveTypeMap[T]
	: T extends PrimitiveType[] ? PrimitiveTypeMap[T[number]][]
	: T extends Shape 				  ? Shaped<T>
	: T extends Shape[]				  ? Shaped<T[number]>[]
	: never

type ExtractFlag<I extends ShapeItem, F extends Flag> = Extract<I['flags'][number], F>

type ExtractRequired<I extends ShapeItem> = ExtractFlag<I, 'required'>

// prettier-ignore
type ShapedInternal<S extends Shape | Shape[]> = {
	[K in keyof S]
	  : S[K] extends PrimitiveType   ? PrimitiveTypeMap[S[K]] 					// string,   boolean,   number
		: S[K] extends PrimitiveType[] ? PrimitiveTypeMap[S[K][number]][] // string[], boolean[], number[]
		: S[K] extends ShapeItem       ? Expand<ShapedItem<S[K]['type']>>
		: S[K] extends Shape           ? Expand<Shaped<S[K]>>
		: S[K] extends Shape[]  			 ? Expand<Shaped<S[K][number]>>[]
		: never
}

export type Shaped<S extends Shape | Shape[]> = Expand<
	Partial<ShapedInternal<S>> & (S extends Shape ? ShapedInternal<RequiredOnly<S>> : {})
>

type RequiredOnly<S extends Shape> = {
	[K in keyof S as S[K] extends ShapeItem
		? ExtractRequired<S[K]> extends never
			? never
			: K
		: never]: S[K]
}

export type PersistentOnly<S extends Shape> = {
	[K in keyof S as S[K] extends ShapeItem
		? ExtractFlag<S[K], 'transient'> extends never
			? K
			: never
		: never]: S[K]
} &
	Shape

export type PersistentShaped<S extends Shape> = Shaped<
	{
		[K in keyof S as S[K] extends ShapeItem
			? ExtractFlag<S[K], 'transient'> extends never
				? K
				: never
			: K]: S[K]
	}
>

export type Shapes = typeof shapes
export type ShapeName = keyof Shapes

export type PickObject<SN extends ShapeName> = Shaped<Shapes[SN]>
export type PickPersistentObject<SN extends ShapeName> = PersistentShaped<Shapes[SN]>

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
export type StringKeys = { [key: string]: any }
