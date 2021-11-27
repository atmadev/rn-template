import { Profile, ProfileConfig, TestEntity } from 'shared/types'
import { PersistentShaped, ShapeName } from 'shared/types/primitives'
import { setupDB, SQLDB } from './sqlite'
import { SQLSchema } from './sqlite/types'
import testEntities from 'resources/testEntities.json'

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

export const runTest = async () => {
	try {
		const { TestEntity } = db.tables
		await TestEntity.delete().run()
		const emptyCount = await TestEntity.aggregate('COUNT(*)').fetch()
		expectToBe(emptyCount['COUNT(*)'], 0)

		await TestEntity.insert(...(testEntities as unknown as TestEntity[]))
		const count = await TestEntity.aggregate('COUNT(*)', 'AVG(number)').fetch()
		// log(count)
		expectToBe(count['COUNT(*)'], 10)
		expectToBe(count['AVG(number)'], 6)

		// const entities = await TestEntity.select().fetch()
		// log(entities)

		const isNull = await TestEntity.select('nullable').where('nullable', 'IS', 'NULL').fetch()
		expectCount(isNull, 7)

		const notNull = await TestEntity.select('nullable').where('nullable', 'IS', 'NOT NULL').fetch()
		expectCount(notNull, 3)

		const boolTrue = await TestEntity.select('boolean').where('boolean', '=', true).fetch()
		expectCount(boolTrue, 3)

		const boolFalse = await TestEntity.select('boolean').where('boolean', '=', false).fetch()
		expectCount(boolFalse, 7)

		const between = await TestEntity.select('number').where('number', 'BETWEEN', [4, 6]).fetch()
		expectCount(between, 4)

		const notBetween = await TestEntity.select('number')
			.where('number', 'NOT BETWEEN', [4, 6])
			.fetch()
		expectCount(notBetween, 6)

		const IN = await TestEntity.select('word')
			.where('word', 'IN', ['Hare', 'Krishna', 'Rama'])
			.fetch()
		expectCount(IN, 5)

		const notIN = await TestEntity.select('word')
			.where('word', 'NOT IN', ['Hare', 'Krishna', 'Rama'])
			.fetch()
		expectCount(notIN, 5)

		console.log('🎉 Test success!')
	} catch (e) {
		console.log('⛔️ Test error:', e)
	}
}

const expectToBe = <T>(value: T, toBe: T) => {
	if (value === toBe) console.log('✅')
	else throw new Error(`${value} is not ${toBe})`)
}

const expectCount = (value: any[], count: number) => {
	if (value.length === count) console.log('✅')
	else throw new Error(`${value} count is not ${count})`)
}

// const log = (data: any) =>
// console.log(data, 'count', data?.length, 'hash', hash(JSON.stringify(data)))
