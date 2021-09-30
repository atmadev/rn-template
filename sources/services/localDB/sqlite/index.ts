import { PickShape, ShapeName } from 'shared/types/primitives'
import { mapKeys } from 'shared/types/utils'
import { capitalized } from 'services/utils'
import { SQLiteRowInfo } from './types'
import { SelectQuery } from './queries'
import { transaction } from './utils'

export const setupDBForShapes = async <UsedShapeNames extends ShapeName>(
	...shapeNames: UsedShapeNames[]
) => {
	const tableInfos = {} as { [K in UsedShapeNames]: SQLiteRowInfo[] }
	await transaction((tx) => {
		console.log('\n\n--- setupDBForShapes ---\n')
		for (const shapeName of shapeNames) {
			const createColumns = mapKeys(shapeName, (key, _, flags) => {
				if (flags.includes('transient')) return null
				let string = key
				if (flags.includes('required')) string += ' NOT NULL'

				// TODO: add UNIQUE index manually to manage shape changes

				if (flags.includes('unique')) string += ' UNIQUE'
				return string
			})

			const indexColumns = mapKeys(shapeName, (key, _, flags) => {
				if (flags.includes('unique') || !flags.includes('indexed')) return null
				return key
			})

			tx.query(`CREATE TABLE IF NOT EXISTS ${shapeName} (${createColumns.join(', ')})`)

			indexColumns.forEach((i) =>
				tx.query(
					`CREATE INDEX IF NOT EXISTS ${
						shapeName + capitalized(i) + 'Index'
					} ON ${shapeName} (${i})`,
				),
			)

			tx.query(
				`PRAGMA table_info(${shapeName});'`,
				undefined,
				(_, array) => {
					tableInfos[shapeName] = array
				},
				(error) => console.log('Columns check error', error),
			)
		}
	})

	// Validate unique indexes
	// Remove uneeded indexes
	// validate are all fields presented in the SQLite
	// console.log('infos', tableInfos)

	const tables = {} as { [K in UsedShapeNames]: Table<K> }
	for (const shapeName of shapeNames) {
		tables[shapeName] = new Table(shapeName)
	}

	return { tables, table: <Name extends UsedShapeNames>(name: Name) => tables[name] }
}

class Table<N extends ShapeName, T = PickShape<N>> {
	readonly name: N
	constructor(name: N) {
		this.name = name
	}

	// insert = (object: T) => new InsertQuery(this.name, Object.keys(object))
	select = (...columns: (keyof T)[]) => new SelectQuery(this.name, columns)
	update = () => {}
	delete = () => {}

	createIndex = async (...columns: (keyof T & string)[]) =>
		transaction((tx) =>
			tx.query(
				`CREATE INDEX IF NOT EXISTS ${
					this.name + columns.map((c) => capitalized(c)).join('') + 'Index'
				} ON ${this.name} (${columns.join(',')})`,
			),
		)
}

const t = new Table('Profile')
const q = t.select('firstName', 'id')

q.where('firstName', 'LIKE', 's%')
	.and('age', '>=', 22)
	.and('age', 'NOT BETWEEN', [1, 2])
	.and('lastName', 'IN', ['Alex', 'Julia', 'Liana'])
	.and('male', '=', true)
	.and('id', '=', 'ffew')
	.and('lastName', 'IS', 'NOT NULL')

q.where('lastName', 'LIKE', 's%')
	.or('lastName', 'LIKE', '% s%')
	.or('firstName', 'LIKE', 's%')
	.or('firstName', 'LIKE', '% s%')

q.where('firstName', 'LIKE', 'Valera').and('age', '>', 12)

q.orderBy('interests DESC', 'firstName', 'lastName DESC', 'interests')
