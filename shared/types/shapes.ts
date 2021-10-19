import { primitiveTypes, Type, Flag, Shape, TRUE } from './primitives'

// TODO: think about advances ShapeItems with factoryMethods
const { string, number, boolean } = primitiveTypes

const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	if (flags === undefined || flags.length === 0)
		throw new Error('ShapItem Flags can not be empty. Just set type directly instead')
	return { type, flags, _shapeItem: TRUE }
}

const r = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	return { type, flags, required: TRUE, _shapeItem: TRUE }
}

const shape = <T extends Shape>(s: T) => s

const id = r(string, 'primary')

const Country = shape({
	id,
	name: string,
})

const Profile = shape({
	id,
	createdAt: r(number, 'indexed'),
	numbers: _([number], 'indexed'),
	country: _(Country, 'transient'),
	countryId: _(string, 'indexed'),
	online: _(boolean, 'transient'),

	firstName: string,
	lastName: string,
	age: number,
	male: boolean,
	interests: [string],
	settings: {
		pushNotification: boolean,
	},
	bio: string,
})

export const shapes = { Country, Profile }
