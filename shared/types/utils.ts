import { Type, ShapeName, Flag } from './primitives'
import { shapes } from './shapes'

export const mapKeys = <T>(
	shapeName: ShapeName,
	mapper: (key: string, type: Type, flags: Flag[], required?: true) => T | null,
): T[] => {
	const shape = shapes[shapeName]

	return Object.entries(shape)
		.map(([key, item]) => {
			let type
			let flags: Flag[] = []
			let required

			if (item instanceof Object && '_shapeItem' in item) {
				type = item.type
				flags = item.flags
				if ('required' in item) required = item.required
			} else type = item

			return mapper(key, type, flags, required)
		})
		.filter((_) => _) as T[]
}
