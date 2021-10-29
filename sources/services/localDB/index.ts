import { PersistentShaped, ShapeName } from 'shared/types/primitives'
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
		unique: [['uid', 'd DESC']],
		index: [['uid', 'dateSynced']],
	},
}

let db: SQLDB<UsedShapeNames>

type Entry = PersistentShaped<'Entry'>

export const initLocalDB = async () => (db = await setupDB(schema))
// prettier-ignore
export const searchProfile = (searchString: string) =>
	db.table('Profile')
		.select('uid', 'firstName', 'lastName')
		.search(searchString, 'firstName', 'lastName', 'spiritualName', 'bio')
		.orderBy('spiritualName NULL LAST', 'firstName', 'lastName')
		.fetch(30)

// TODO: Test it
export const insertEntries = (entries: Entry[]) => db.table('Entry').insert(...entries)

export const updateEntry = (uid: string, d: number, entry: Partial<Omit<Entry, 'uid' | 'd'>>) =>
	db.table('Entry').update(entry).match({ uid, d }).run()

/*
export const entries = (uid: string, month: string) =>
	db.table('Entry').select().match({ uid }).where('d', '>', ).orderBy('d DESC').fetch()
*/
export const entriesToSync = (uid: string) =>
	db
		.table('Entry')
		.select()
		.match({ uid })
		.where('dateSynced', 'IS', 'NULL')
		.or('dateSynced', '<', 'du', true)
		.fetch()
