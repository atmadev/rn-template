export const getLast = <T>(a: T[]) => (a.length > 0 ? a[a.length - 1] : null)
export const capitalized = (string: string) => string.charAt(0).toUpperCase() + string.slice(1)

export const pick = <O, K extends keyof O>(object: O, ...keys: K[]) => {
	const result = {} as Pick<O, K>
	keys.forEach((k) => (result[k] = object[k]))
	return result
}

export const hash = function (str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed
	let h2 = 0x41c6ce57 ^ seed

	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i)
		h1 = Math.imul(h1 ^ ch, 2654435761)
		h2 = Math.imul(h2 ^ ch, 1597334677)
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
	return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

type OnlyValueTypes<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] }
// type OnlyObjects<T> = OnlyValueTypes<T, object>
type OnlyStrings<T> = OnlyValueTypes<T, string>

export const mapFromArray = <
	T,
	K extends keyof OnlyStrings<T>,
	V extends keyof T | undefined,
	MAP = V extends undefined ? { [key: string]: T } : { [key: string]: T[Exclude<V, undefined>] },
>(
	array: T[],
	key: K,
	value: V,
) => {
	const map = {} as MAP

	array.forEach((object) => {
		// @ts-ignore
		const id = object[key]
		// @ts-ignore
		map[id] = value ? object[value] : object
	})
	return map
}
