import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { capitalized } from 'services/utils'
import { Querible, SQLSchema } from './types'
import { DeleteQuery, InsertQuery, SelectQuery, UpdateQuery } from './queries'
import { transaction } from './engine'
import { setUpSchemaIfNeeded } from './migration'

export const setupDB = async <UsedShapeNames extends ShapeName>(
	schema: SQLSchema<UsedShapeNames>,
): Promise<SQLDB<UsedShapeNames>> => {
	console.log('\n\n--- setupDBForShapes ---\n')

	const shapeNames = Object.keys(schema) as UsedShapeNames[]

	await setUpSchemaIfNeeded(schema)

	const tables = {} as SQLDB<UsedShapeNames>['tables']
	for (const shapeName of shapeNames) {
		tables[shapeName] = new Table(shapeName)
	}

	return { tables, table: (name) => tables[name] }
}

class Table<TableName extends ShapeName, Object = PersistentShaped<TableName>> {
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

export type SQLDB<ShapeNames extends ShapeName> = {
	table: <SN extends ShapeNames>(table: SN) => Table<SN>
	tables: { [SN in ShapeNames]: Table<SN> }
}
