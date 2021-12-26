import { FALSE, Shape, Shaped, TRUE } from 'shared/types/primitives'
import { validateObjectWithShape } from 'shared/types/utils'

export const request = async <ParamsShape extends Shape, ResponseShape extends Shape>(
	method: 'GET' | 'POST',
	url: string,
	body: {
		shape: { [shapeName: string]: ParamsShape }
		data: Shaped<ParamsShape>
	},
	response: { [shapeName: string]: ResponseShape },
): Promise<Response<Shaped<ResponseShape>>> => {
	const [bodyShapeName, bodyShape] = Object.entries(body.shape)[0]
	const bodyJson = JSON.stringify(body.data)

	console.log('request', method, url, bodyJson)

	validateObjectWithShape(body.data, bodyShape, bodyShapeName, 'Invalid Request Body')

	const result = await fetch(url, {
		method,
		headers: {
			'Content-Type': 'application/json;charset=utf-8',
		},
		body: bodyJson,
	})

	console.log('result', result.ok, result.status, result.statusText, result.type)
	const data = await result.json()
	console.log('response', method, url, data)

	if (result.ok) {
		// TODO: validate response code

		const [responseShapeName, responseShape] = Object.entries(response)[0]
		validateObjectWithShape(data, responseShape, responseShapeName)
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
