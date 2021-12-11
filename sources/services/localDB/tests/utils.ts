import { styleLog } from 'shared/utils'

export const expectToBe = <T>(value: T, toBe: T) => {
	if (value !== toBe) throw new Error(`${value} is not ${toBe})`)

	console.log('  ✅', styleLog('grey', `equal ${toBe}`))
}

export const expectCount = (value: any[], count: number) => {
	if (value.length !== count) throw new Error(`${JSON.stringify(value)} count is not ${count})`)

	console.log('  ✅', styleLog('grey', `count ${count}`))
}

export const expectIDs = (data: { id: number }[], ...ids: number[]) => {
	if (data.length !== ids.length)
		throw new Error(`Fetched ${data.length} elements instead of ${ids.length}`)
	for (const { id } of data) {
		if (!ids.includes(id)) throw new Error(`${id} should not be presented in the result`)
	}

	console.log('  ✅', styleLog('grey', `ids ${ids.join(', ')}`))
}

export const expectOrder = <Item, Key extends keyof Item, Value = Item[Key]>(
	data: Item[],
	key: Key,
	desc = false,
) => {
	let previous: Value | null = null
	for (const item of data) {
		if (previous !== null) {
			if (desc) {
				// @ts-ignore
				if (item[key] > previous)
					throw new Error(
						`Invalid Order by ${key}, should be descending ${JSON.stringify(data, undefined, 2)}`,
					)
				// @ts-ignore
			} else if (item[key] < previous)
				throw new Error(
					`Invalid Order by ${key}, should be ascending ${JSON.stringify(data, undefined, 2)}`,
				)
		}
		// @ts-ignore
		previous = item[key]
	}

	console.log('  ✅', styleLog('grey', `order ${desc ? 'descending' : 'ascending'}`))
}

export const expectKeys = <Item, Key extends keyof Item>(data: Item[], ...keys: Key[]) => {
	for (const item of data) {
		const selectedKeys = Object.keys(item) as Key[]
		if (selectedKeys.length !== keys.length)
			throw new Error(`Selected ${selectedKeys.length} keys instead of ${keys.length}`)

		for (const selectedKey of selectedKeys) {
			if (!keys.includes(selectedKey))
				throw new Error(
					`Key ${selectedKey} shoudn't be selected. Expected keys ${keys}, actual keys ${selectedKeys}`,
				)
		}
	}

	console.log('  ✅', styleLog('grey', `keys ${keys.join(', ')}`))
}

// const log = (data: any) =>
// console.log(data, 'count', data?.length, 'hash', hash(JSON.stringify(data)))
