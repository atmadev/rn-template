const logStyle = {
	bold: '1',
	grey: '2',
	italic: '3',
	red: '31',
	green: '32',
	yellow: '33',
}

export const styleLog = (style: keyof typeof logStyle, string: string) =>
	`\x1b[${logStyle[style]}m${string}\x1b[0m`
