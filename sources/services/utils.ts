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