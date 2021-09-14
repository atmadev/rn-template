import { Expand } from './utils'

type Flag = 'required' | 'indexed' | 'unique' | 'transient'

type TypeInternal = PrimitiveType | Shape
type Type = TypeInternal | TypeInternal[]

type ShapeItem = {
	type: Type
	flags: Flag[]
}

type Shape = {
	[key: string]: ShapeItem | Type
}

type PrimitiveTypeMap = {
	string: string
	number: number
	boolean: boolean
}

const primitiveTypes = {
	string: 'string' as const,
	number: 'number' as const,
	boolean: 'boolean' as const,
}

type PrimitiveType = keyof typeof primitiveTypes

const { string, number, boolean } = primitiveTypes

const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => ({ type, flags })

const shape = <T extends Shape>(s: T) => s

export const Country = shape({
	id: _('string', 'indexed', 'unique'),
	name: _('string'),
})

export const Profile = shape({
	id: _(string, 'unique', 'indexed', 'required'),
	createdAt: _(number, 'indexed'),
	country: _(Country, 'required'),
	online: _(boolean),

	firstName: string,
	lastName: string,
	age: number,
	male: boolean,
	interests: [string],
	settings: {
		pushNotification: boolean,
	},
})

type Typed<T extends Type> = T extends PrimitiveType ? PrimitiveTypeMap[T] : Shaped<T>

type Shaped<T> = {
	[P in keyof T]: T[P] extends PrimitiveType
		? PrimitiveTypeMap[T[P]]
		: T[P] extends ShapeItem
		? Expand<Typed<T[P]['type']>>
		: Expand<Shaped<T[P]>>
}
