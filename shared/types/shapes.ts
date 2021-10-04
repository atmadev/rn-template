import { primitiveTypes, Type, Flag, Shape } from './primitives'

const { string, number, boolean } = primitiveTypes

const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	if (flags === undefined || flags.length === 0)
		throw new Error('ShapItem Flags can not be empty. Just set type directly instead')
	return { type, flags }
}

const shape = <T extends Shape>(s: T) => s

const id = _(string, 'unique', 'indexed', 'required')

const Country = shape({
	id,
	name: string,
})

const Profile = shape({
	id,
	createdAt: _(number, 'indexed', 'required'),
	numbers: _([number], 'indexed'),
	country: _(Country, 'required', 'transient'),
	countryId: _(string, 'indexed'),
	online: _(boolean, 'transient'),

	firstName: _(string, 'required'),
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
