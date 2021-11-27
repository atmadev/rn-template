import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { AggregateSelectItem, SQLSchema } from './types'
import { AggregateQuery, DeleteQuery, InsertQuery, SelectQuery, UpdateQuery } from './queries'
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

	aggregate = <Columns extends AggregateSelectItem<keyof PersistentShaped<TableName> & string>>(
		...columns: Columns[]
	) => new AggregateQuery(this.name, columns)

	update = (object: Partial<PersistentShaped<TableName>>) => new UpdateQuery(this.name, object)
	delete = () => new DeleteQuery(this.name)
}

export type SQLDB<ShapeNames extends ShapeName> = {
	table: <SN extends ShapeNames>(table: SN) => Table<SN>
	tables: { [SN in ShapeNames]: Table<SN> }
}
