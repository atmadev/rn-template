// prettier-ignore
import { primitiveTypes, Type, Flag, Shape } from './primitives'

// TODO: think about advances ShapeItems with factoryMethods
const { string, number, boolean, any, TRUE } = primitiveTypes

// prettier-ignore
const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => ({ type, flags, _shapeItem: true as const })
// prettier-ignore
const r = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => ({ type, flags, required: true as const, _shapeItem: true as const })

const shape = <T extends Shape>(s: T) => s

export const CustomField = shape({
	name: r(string),
	type: r(string),
	id: r(string, 'local'),
})

export const Profile = shape({
	uid: r(string, 'local'),
	firstName: string,
	lastName: string,
	spiritualName: string,
	avatarURL: string,
	bio: string,
	dateUpdated: r(number),
})

export const ProfileConfig = shape({
	uid: r(string, 'local'),
	lastCustomFieldID: r(number),
	standardFields: {
		w: TRUE,
		m: TRUE,
		s: TRUE,
		y: TRUE,
		l: TRUE,
		n: TRUE,
		b: TRUE,
	},
	customFields: { [string]: CustomField },
	dateUpdated: r(number),
})

// prettier-ignore
export const Entry = shape({
	w: number,  // wake
	m: boolean, // mangala arati
	7: number,  // japa before 7:30
	10: number, // japa before 10:00
	18: number, // japa before 18:00
	24: number, // japa before 00:00
	r: boolean, // reading
	k: boolean, // kirtan
	s: boolean, // service
	y: boolean, // yoga
	l: boolean, // lectures
	n: string,  // notes
	b: number,  // bed
	c: { [string]: any }, // custom fields
	du: number, // date updated
	dateSynced: _(number, 'local'),
	date: r(number, 'local'),
	uid: r(string, 'local'),
})

// type E = ExpandDeep<Shaped<'ProfileConfig'>>
// type P = ExpandDeep<Shaped<'Profile'>>
