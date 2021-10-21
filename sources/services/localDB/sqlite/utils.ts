// @ts-ignore
// eslint-disable-next-line
export const flatLog = (result: any[]) => {
	result.forEach((r) => Object.entries(r).forEach((e) => console.log(...e)))
}

export const indexName = (table: string, columns: string[]) =>
	table + '__' + columns.sort().join('__').replaceAll(' ', '_')
