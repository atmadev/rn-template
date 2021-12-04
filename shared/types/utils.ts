import { Type, ShapeName, Flag } from './primitives'
import { shapes } from './'

export const mapKeys = <T>(
	shapeName: ShapeName,
	mapper: (
		key: string,
		params: { type: Type; flags: Flag[]; required?: true; primary?: true },
	) => T | null,
): T[] => {
	const shape = shapes[shapeName]

	return Object.entries(shape)
		.map(([key, item]) => {
			let type
			let flags: Flag[] = []
			let required
			let primary

			if (item instanceof Object && '_shapeItem' in item) {
				type = item.type
				flags = item.flags
				if ('required' in item) required = item.required
				if ('primary' in item) primary = item.primary
			} else type = item

			return mapper(key, { type, flags, required, primary })
		})
		.filter((_) => _) as T[]
}
