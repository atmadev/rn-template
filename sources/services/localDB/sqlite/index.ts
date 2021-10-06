import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { capitalized } from 'services/utils'
import { Querible } from './types'
import { DeleteQuery, InsertQuery, SelectQuery, UpdateQuery } from './queries'
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

export class Table<TableName extends ShapeName, Object = PersistentShaped<TableName>> {
	readonly name: TableName
	constructor(name: TableName) {
		this.name = name
	}

	insert = (...objects: Object[]) => {
		const query = new InsertQuery(this.name, objects)
		return query.run()
	}

	select = <SelectedColumn extends keyof PersistentShaped<TableName>>(
		...columns: SelectedColumn[]
	) => new SelectQuery(this.name, columns)

	update = (object: Partial<PersistentShaped<TableName>>) => new UpdateQuery(this.name, object)
	delete = () => new DeleteQuery(this.name)

	createIndex = async (...columns: (keyof Querible<PersistentShaped<TableName>> & string)[]) =>
		transaction((tx) =>
			tx.query(
				`CREATE INDEX IF NOT EXISTS ${
					this.name + columns.map((c) => capitalized(c)).join('') + 'Index'
				} ON ${this.name} (${columns.join(',')})`,
			),
		)
}
