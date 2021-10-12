// @ts-ignore
// eslint-disable-next-line
const flatLog = (result: any[]) => {
	result.forEach((r) => Object.entries(r).forEach((e) => console.log(...e)))
}
