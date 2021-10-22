import { primitiveTypes, Type, Flag, Shape, TRUE } from './primitives'

// TODO: think about advances ShapeItems with factoryMethods
const { string, number, boolean } = primitiveTypes

const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	return { type, flags, _shapeItem: TRUE }
}

const r = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	return { type, flags, required: TRUE, _shapeItem: TRUE }
}

const shape = <T extends Shape>(s: T) => s

const id = r(number)

const Country = shape({
	id,
	name: string,
})

const Profile = shape({
	id,
	createdAt: r(number),
	numbers: [number],
	country: r(Country, 'transient'),
	countryId: r(string),
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
