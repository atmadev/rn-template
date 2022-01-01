import { FALSE, Shape, Shaped, TRUE } from 'shared/types/primitives'
import { validateObjectWithShape } from 'shared/types/utils'

export const request = async <ParamsShape extends Shape, ResponseShape extends Shape>(
	method: RequestMethod,
	url: string,
	request?: {
		headers?: { [key: string]: string }
		body?: {
			shape: { [shapeName: string]: ParamsShape }
			data: Shaped<ParamsShape>
		}
	},
	response?: { [shapeName: string]: ResponseShape },
): Promise<
	| { success: true; data: Response<Shaped<ResponseShape>> }
	| { success: false; error: { name: string; message: string } }
> => {
	console.log('request', method, url, request?.body?.data)
	let body

	if (request?.body) {
		const [bodyShapeName, bodyShape] = Object.entries(request.body.shape)[0]
		validateObjectWithShape(request.body.data, bodyShape, bodyShapeName, 'Invalid Request Body')
		body = JSON.stringify(request.body.data)
	}

	const result = await fetch(url, {
		method,
		headers: {
			'Content-Type': 'application/json;charset=utf-8',
			...request?.headers,
		},
		body,
	})

	console.log('result', result.ok, result.status, result.statusText, result.type)
	const data = await result.json()
	console.log('response', method, url, data)

	if (result.ok) {
		// TODO: validate response code

		if (response) {
			const [responseShapeName, responseShape] = Object.entries(response)[0]
			validateObjectWithShape(data, responseShape, responseShapeName)
		}
		return { success: TRUE, data }
	} else {
		return {
			success: FALSE,
			error: {
				name: data.error,
				message: data.error_description,
			},
		}
	}
}

type Response<T> =
	| { success: true; data: T }
	| {
			success: false
			error: {
				name: ErrorName
				message: string
			}
	  }

type ErrorName = 'unsupported_grant_type'

export type RequestMethod = 'GET' | 'POST' | 'PUT'
