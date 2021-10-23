import { ShapeName } from 'shared/types/primitives'
import { setupDB, SQLDB } from './sqlite'
import { SQLSchema } from './sqlite/types'

const useShapes = <SN extends ShapeName>(...names: SN[]) => names

const usedShapeNames = useShapes('Profile', 'Entry')

type UsedShapeNames = typeof usedShapeNames[number]

const schema: SQLSchema<UsedShapeNames> = {
	Profile: {
		primaryKey: 'uid',
	},
	Entry: {
		unique: [['date DESC', 'uid']],
		index: [['uid', 'dateSynced', 'du']],
	},
}

let db: SQLDB<UsedShapeNames>

export const initLocalDB = async () => (db = await setupDB(schema))
// prettier-ignore
export const searchProfile = async (searchString: string) =>
	db.table('Profile')
		.select('uid', 'firstName', 'lastName')
		.search(searchString, 'firstName', 'lastName', 'spiritualName', 'bio')
		.orderBy('spiritualName NULL LAST', 'firstName', 'lastName')
		.fetch(30)
