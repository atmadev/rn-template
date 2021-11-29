import { Profile, ProfileConfig } from 'shared/types'
import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { setupDB, SQLDB } from './sqlite'
import { SQLSchema } from './sqlite/types'
import { runTest as _runTest } from './tests'

const useShapes = <SN extends ShapeName>(...names: SN[]) => names

const usedShapeNames = useShapes('Profile', 'Entry', 'ProfileConfig', 'TestEntity')

type UsedShapeNames = typeof usedShapeNames[number]

const schema: SQLSchema<UsedShapeNames> = {
	Profile: {
		primaryKey: 'uid',
	},
	ProfileConfig: {
		primaryKey: 'uid',
	},
	Entry: {
		unique: [['uid', 'd DESC']],
		index: [['uid', 'dateSynced']],
	},
	TestEntity: {},
}

let db: SQLDB<UsedShapeNames>

type Entry = PersistentShaped<'Entry'>

export const initLocalDB = async () => (db = await setupDB(schema))

export const insertProfiles = (profiles: Profile[]) => db.table('Profile').insert(...profiles)
export const importProfileConfigs = async (configs: ProfileConfig[]) => {
	const mappedConfigs = (await db.table('Profile').select('uid').fetch()).map((value, index) => {
		const config = configs[index]
		config.uid = value.uid
		return config
	})

	return db.table('ProfileConfig').insert(...mappedConfigs)
}

// prettier-ignore
export const searchProfile = (searchString: string) =>
	db.table('Profile')
		.select('uid', 'firstName', 'lastName', 'spiritualName')
		.search(searchString, 'firstName', 'lastName', 'spiritualName', 'bio')
		.orderBy('spiritualName NULLS LAST', 'firstName', 'lastName')
		.fetch(30)

// TODO: Test it
export const insertEntries = (entries: Entry[]) => db.table('Entry').insert(...entries)
export const importEntries = async (entries: Entry[]) => {
	const mappedEntries = (await db.table('Profile').select('uid').fetch()).flatMap(
		(value, index) => {
			const tenEntries = entries.slice(index * 10, index * 10 + 9)
			tenEntries.forEach((e) => (e.uid = value.uid))
			return tenEntries
		},
	)

	return db.table('Entry').insert(...mappedEntries)
}

export const updateEntry = (uid: string, d: number, entry: Partial<Omit<Entry, 'uid' | 'd'>>) =>
	db.table('Entry').update(entry).match({ uid, d }).run()

/*
export const entries = (uid: string, month: string) =>
	db.table('Entry').select().match({ uid }).where('d', '>', ).orderBy('d DESC').fetch()
*/
// prettier-ignore
export const entriesToSync = (uid: string) =>
	db.table('Entry')
		.select()
		.match({ uid })
		.where('dateSynced', 'IS', 'NULL')
		.or('dateSynced', '<', 'du', true)
		.fetch()

export const runTest = () => _runTest(db.table('TestEntity'))
