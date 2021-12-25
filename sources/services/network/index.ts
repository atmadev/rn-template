import { Shape, Shaped } from 'shared/types/primitives'
import { validateObjectWithShape } from 'shared/types/utils'

export const request = async <ParamsShape extends Shape, ResponseShape extends Shape>(
	method: 'GET' | 'POST',
	url: string,
	params: {
		shape: ParamsShape
		shapeName: string
		body: Shaped<ParamsShape>
	},
	response: {
		shape: ResponseShape
		shapeName: string
	},
): Promise<Response<Shaped<ResponseShape>>> => {
	validateObjectWithShape(params.body, params.shape, params.shapeName, 'Invalid Request Body')

	const result = await fetch(url, { method, body: JSON.stringify(params) })

	const json = await result.json()
	validateObjectWithShape(json, response.shape, response.shapeName)
	return json
}

// declare interface RequestInit {
// 	body?: BodyInit_
// 	credentials?: RequestCredentials_
// 	headers?: HeadersInit_
// 	integrity?: string
// 	keepalive?: boolean
// 	method?: string
// 	referrer?: string
// 	window?: any
// 	signal?: AbortSignal
// }

type Response<T> = { success: true; data: T } | { success: false; message: string }
