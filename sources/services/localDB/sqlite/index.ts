import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { capitalized } from 'services/utils'
import { Querible } from './types'
import { InsertQuery, SelectQuery } from './queries'
import { setUpSchemaIfNeeded, transaction } from './utils'

export const setupDBForShapes = async <UsedShapeNames extends ShapeName>(
	...shapeNames: UsedShapeNames[]
) => {
	console.log('\n\n--- setupDBForShapes ---\n')

	await setUpSchemaIfNeeded(...shapeNames)

	const tables = {} as { [K in UsedShapeNames]: Table<K> }
	for (const shapeName of shapeNames) {
		tables[shapeName] = new Table(shapeName)
	}

	return { tables, table: <Name extends UsedShapeNames>(name: Name) => tables[name] }
}

class Table<TableName extends ShapeName, Object = PersistentShaped<TableName>> {
	readonly name: TableName
	constructor(name: TableName) {
		this.name = name
	}

	insert = (...objects: Object[]) => {
		const query = new InsertQuery(this.name, objects)
		return query.perform()
	}

	select = <SelectedColumn extends keyof PersistentShaped<TableName>>(
		...columns: SelectedColumn[]
	) => {
		return new SelectQuery(this.name, columns)
	}

	update = () => {}
	delete = () => {}

	createIndex = async (...columns: (keyof Querible<PersistentShaped<TableName>> & string)[]) =>
		transaction((tx) =>
			tx.query(
				`CREATE INDEX IF NOT EXISTS ${
					this.name + columns.map((c) => capitalized(c)).join('') + 'Index'
				} ON ${this.name} (${columns.join(',')})`,
			),
		)
}
