import { Flag, Shape, Type } from './primitives'

// prettier-ignore
export const _ = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => ({ type, flags, _shapeItem: true as const })
// prettier-ignore
export const r = <T extends Type, F extends Flag[]>(type: T, ...flags: F) => ({ type, flags, required: true as const, _shapeItem: true as const })
export const p = <T extends Type, F extends Exclude<Flag, 'transient'>[]>(
	type: T,
	...flags: F
) => ({
	type,
	flags,
	required: true as const,
	primary: true as const,
	_shapeItem: true as const,
})

export const shape = <T extends Shape>(s: T) => s
