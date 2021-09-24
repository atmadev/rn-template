import { primitiveTypes, Type, Flag, Shape } from './primitives'

const { string, number, boolean } = primitiveTypes

const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => {
	if (flags === undefined || flags.length === 0)
		throw new Error('ShapItem Flags can not be empty. Just set type directly instead')
	return { type, flags }
}

const shape = <T extends Shape>(s: T) => s

const id = _(string, 'unique', 'indexed', 'required')

export const Country = shape({
	id,
	name: string,
})

export const Profile = shape({
	id,
	createdAt: _(number, 'indexed', 'required'),
	numbers: _([number], 'indexed'),
	countries: [Country],
	country: _(Country, 'required', 'unique'),
	online: _(boolean, 'transient'),

	firstName: string,
	lastName: string,
	age: number,
	male: boolean,
	interests: [string],
	settings: {
		pushNotification: boolean,
	},
})
