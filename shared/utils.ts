// expands object types one level deep
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
export type StringKeys = { [key: string]: any }
/*

//TODO: add coments to the shape type
export type BasicShape = {
	required: StringKeys
	optional?: StringKeys
}

export type Shape = BasicShape & {
	local: StringKeys
}

export type Shapes = Expand<typeof shapes>
export type ShapeKey = keyof Shapes

type MapShapes<T> = {
	[Prop in keyof T]: T[Prop] extends Shape ? Shaped<T[Prop]> : T[Prop] extends Shape[] ? Shaped<T[Prop][0]>[] : T[Prop]
}

export type Shaped<T extends BasicShape> = MapShapes<
	T['required'] & (T extends { optional: StringKeys } ? Partial<T['optional']> : {})
>

export type LocalFromShape<T extends Shape> = MapShapes<T['local']> & Shaped<T>

export type Remote<Name extends ShapeKey> = Shaped<Shapes[Name]>
export type Local<Name extends ShapeKey> = LocalFromShape<Shapes[Name]>

const throwError = (message: string, name?: string) => {
	const error = new Error(message)
	if (name) error.name = name
	throw error
}

export const validateObjectWithShape = (
	object: Object,
	shape: BasicShape,
	shapeName: string,
	errorName = 'TypeValidation',
) => {
	for (const key in shape.required) {
		const value = object[key]
		if (value === undefined || value === null) {
			throwError(`${shapeName}.${key} is ${value}:\n${JSON.stringify(object, undefined, 2)}`, errorName)
		}
	}
}

export const TRUE = true as const
export const FALSE = false as const */
