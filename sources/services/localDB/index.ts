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
		unique: [['month DESC', 'day DESC', 'uid']],
		index: [['uid', 'dateSynced'], ['uid', 'month DESC']],
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
export const insertEntries = (entries: Entry[]) =>
	db.table('Entry').insert(...entries)

export const updateEntry = (uid: string, month: string, day: number, entry: Partial<Omit<Entry, 'uid' | 'month' | 'day'>>) =>
	db.table('Entry').update(entry).match({ uid, month, day }).run()

export const entries = (uid: string, month: string) =>
	db.table('Entry')
		.select()
		.match({ uid, month })
		.orderBy('day DESC')
		.fetch()

export const entriesToSync = (uid: string) =>
	db.table('Entry')
		.select()
		.match({ uid })
		.where('dateSynced', 'IS', 'NULL')
		.or('dateSynced', '<', 'du', true)
		.fetch()