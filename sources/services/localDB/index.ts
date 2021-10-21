import { ShapeName } from 'shared/types/primitives'
import { setupDB } from './sqlite'
import { SQLDB, SQLSchema } from './sqlite/types'

const useShapes = <SN extends ShapeName>(...names: SN[]) => names

const usedShapeNames = useShapes('Profile', 'Country')

type UsedShapeNames = typeof usedShapeNames[number]

const schema: SQLSchema<UsedShapeNames> = {
	Profile: {
		index: [['firstName', 'lastName DESC']],
		unique: [['id']],
		namesHistory: {
			id: ['profileId'],
			firstName: ['name', 'profileName'],
		},
	},
	Country: {},
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
