// prettier-ignore
import { r, p, _,  shape } from './shapeTool'
import { primitiveTypes } from './primitives'

const { string, number, boolean, any, TRUE } = primitiveTypes

export const CustomField = shape({
	name: r(string),
	type: r(string),
	id: r(string, 'local'),
})

export const Profile = shape({
	uid: p(string, 'local'),
	firstName: string,
	lastName: string,
	spiritualName: string,
	avatarURL: string,
	bio: string,
	dateUpdated: r(number),
})

export const ProfileConfig = shape({
	uid: p(string, 'local'),
	lastCustomFieldID: r(number),
	standardFields: {
		wake: TRUE,
		mangala: TRUE,
		service: TRUE,
		yoga: TRUE,
		lectures: TRUE,
		notes: TRUE,
		bed: TRUE,
	},
	customFields: { [string]: CustomField },
	dateUpdated: r(number),
})

// prettier-ignore
export const Entry = shape({
	w: number,  // wake, number of minutes after 00:00
	m: boolean, // mangala arati
	j7: number,  // japa before 7:30
	j10: number, // japa before 10:00
	j18: number, // japa before 18:00
	j24: number, // japa before 00:00
	r: number, // reading, minutes
	k: boolean, // kirtan
	s: boolean, // service
	y: boolean, // yoga
	l: boolean, // lectures
	n: string,  // notes
	b: number,  // bed, number of minutes after 00:00
	c: { [string]: any }, // custom fields
	d: r(number), // date
	du: r(number), // date updated
	dateSynced: _(number, 'local'),
	vsDateSynced: _(number, 'local'),
	uid: r(string, 'local'),
})

export const TestEntity = shape({
	id: p(number),
	number: r(number),
	string: r(string),
	boolean: r(boolean),
	nullable: TRUE,
	word: string,
	changedType: string,
})

export const TestEntity2 = shape({
	id: p(number),
	number: r(number),
	string: r(string),
	bool: r(boolean),
	nullable: TRUE,
	newField: string,
	changedType: number,
})
