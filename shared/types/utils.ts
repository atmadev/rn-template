import { Type, ShapeName, Flag } from './primitives'
import * as shapes from './shapes'

export const mapKeys = <T>(
	shapeName: ShapeName,
	mapper: (key: string, type: Type, flags: Flag[]) => T | null,
): T[] => {
	const shape = shapes[shapeName]

	return Object.entries(shape)
		.map(([key, value]) => {
			let type
			let flags: Flag[] = []

			if (value instanceof Object && 'type' in value) {
				type = value.type
				if ('flags' in value) flags = value.flags
			} else type = value

			return mapper(key, type, flags)
		})
		.filter((_) => _) as T[]
}
