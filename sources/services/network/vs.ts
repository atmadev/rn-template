import { request } from '.'
import { LoginParams, Tokens } from './vsShapes'

export const login = async (username: string, password: string) => {
	try {
		const result = await request(
			'POST',
			'https://vaishnavaseva.net?oauth=token',
			{
				shape: { LoginParams },
				data: { username, password, grant_type: 'password', client_id, client_secret },
			},
			{ Tokens },
		)
		console.log('result', result)
	} catch (e) {
		console.log('login error', e)
	}
}

const client_id = 'IXndKqmEoXPTwu46f7nmTcoJ2CfIS6'
const client_secret = '1A4oOPOatd8j6EOaL3i9pblOUnqa6j'
