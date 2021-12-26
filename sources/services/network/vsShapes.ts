// prettier-ignore
import { r,  shape } from 'shared/types/shapeTool'
import { primitiveTypes } from 'shared/types/primitives'

const { string } = primitiveTypes

export const Tokens = shape({
	access_token: r(string),
	refresh_token: r(string),
	token_type: r(string),
})

export const LoginParams = shape({
	username: r(string),
	password: r(string),
	grant_type: r(string),
	client_id: r(string),
	client_secret: r(string),
})
