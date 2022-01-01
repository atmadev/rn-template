// prettier-ignore
import {  r,  shape } from 'shared/types/shapeTool'
import { primitiveTypes } from 'shared/types/primitives'

const { string, boolean, number } = primitiveTypes

export const Tokens = shape({
	access_token: r(string),
	refresh_token: r(string),
})

export const LoginParams = shape({
	username: r(string),
	password: r(string),
	grant_type: r(string),
	client_id: r(string),
	client_secret: r(string),
})

export const RefreshTokenParams = shape({
	grant_type: r(string),
	refresh_token: r(string),
	client_id: r(string),
	client_secret: r(string),
})

export const User = shape({
	userid: r(string),
	user_name: string,
	user_nicename: string,
	cfg_public: boolean,
	cfg_showmoresixteen: boolean,
	opt_wake: boolean,
	opt_service: boolean,
	opt_exercise: boolean,
	opt_lections: boolean,
	opt_sleep: boolean,
	avatar_url: string,
})

export const EntriesRequest = shape({
	year: r(number),
	month: r(number),
})

export const EntryInputFields = shape({
	jcount_730: string,
	jcount_1000: string,
	jcount_1800: string,
	jcount_after: string,
	reading: string,
	kirtan: string,
	opt_sleep: string,
	opt_wake_up: string,
	opt_exercise: string,
	opt_service: string,
	opt_lections: string,
})

export const PostEntry = shape({
	entrydate: r(string),
	...EntryInputFields,
})

export const EntryID = shape({
	entry_id: r(string),
})

export const UpdateEntry = shape({
	...EntryID,
	...PostEntry,
})

export const Entry = shape({
	id: r(string),
	created_at: r(string),
	updated_at: r(string),
	user_id: r(string),
	date: r(string),
	day: r(string),
	...EntryInputFields,
})

export const EntriesResponse = shape({
	entries: r([Entry]),
	filter: r({
		page_num: number,
		items_per_page: number,
	}),
})
