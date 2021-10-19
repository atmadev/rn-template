import { ShapeName } from 'shared/types/primitives'
import { setupDB } from './sqlite'
import { SQLDB, SQLSchema } from './sqlite/types'

const useShapes = <SN extends ShapeName>(...names: SN[]) => names

const usedShapeNames = useShapes('Profile')

type UsedShapeNames = typeof usedShapeNames[number]

const schema: SQLSchema<UsedShapeNames> = {
	Profile: {
		primaryKey: 'id',
		index: [['firstName', 'lastName']],
		unique: [
			['id', 'interests'],
			['firstName', 'createdAt'],
		],
		namesHistory: {
			id: ['profileId'],
			firstName: ['name', 'profileName'],
		},
	},
}

let db: SQLDB<UsedShapeNames>

export const initLocalDB = async () => {
	db = await setupDB(schema)
}

export const searchProfile = async (searchString: string) =>
	db
		.table('Profile')
		.select('id', 'firstName', 'lastName')
		.search(searchString, 'firstName', 'lastName')
		.orderBy('firstName', 'lastName')
		.fetch(30)
