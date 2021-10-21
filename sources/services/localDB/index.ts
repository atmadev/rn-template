import { ShapeName } from 'shared/types/primitives'
import { setupDB, SQLDB } from './sqlite'
import { SQLSchema } from './sqlite/types'

const useShapes = <SN extends ShapeName>(...names: SN[]) => names

const usedShapeNames = useShapes('Profile', 'Country')

type UsedShapeNames = typeof usedShapeNames[number]

const schema: SQLSchema<UsedShapeNames> = {
	Profile: {
		unique: [['id']],
		index: [['firstName', 'lastName DESC']],
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
