import { styleLog } from 'shared/utils'
import { Table } from '../sqlite'
import { expectToBe, expectCount, expectIDs, expectKeys, expectOrder } from './utils'

export const testMigratedData = async (t: Table<'TestEntity2'>) => {
	await setUpTestData(t)
	await testAggregateFunctions(t)
	await testSingleWheres(t)
	await testMultipleWheres(t)
	await testLimitOffset(t)
}

const setUpTestData = async (t: Table<'TestEntity2'>) => {
	await t
		.updateMultiple([
			{ id: 1, newField: 'Krishna', changedType: 1 },
			{ id: 2, newField: 'Rama' },
			{ id: 3, newField: 'Sita', changedType: null },
			{ id: 4, newField: 'Jaganatha', changedType: 4 },
			{ id: 5, newField: 'Parashurama' },
			{ id: 6, newField: 'Vasudevaya' },
			{ id: 7, newField: 'Narasimhadev' },
			{ id: 8, newField: 'Matsya Avatara' },
			{ id: 9, newField: 'Kalki Avatara' },
			{ id: 10, newField: 'Subhadra' },
		])
		.run()

	const updatedData = await t.select('id', 'changedType').fetch(5)
	expectToBe(updatedData[0].changedType, 1)
	// @ts-ignore
	expectToBe(updatedData[1].changedType, '2')
	expectToBe(updatedData[2].changedType, null)
	expectToBe(updatedData[3].changedType, 4)
	expectToBe(updatedData[4].changedType, null)
	console.log('\n')
}

const testAggregateFunctions = async (t: Table<'TestEntity2'>) => {
	console.log(styleLog('bold', '🧪 Aggregate Functions 2\n'))
	// prettier-ignore
	const count = await t.aggregate(
				'COUNT(*)','AVG(number)','GROUP_CONCAT(DISTINCT newField)',`GROUP_CONCAT(newField, ' | ')`, 'COUNT(nullable)').fetch()
	expectToBe(count['COUNT(*)'], 10)
	expectToBe(count['AVG(number)'], 6)
	expectToBe(
		count[`GROUP_CONCAT(DISTINCT newField)`],
		'Krishna,Rama,Sita,Jaganatha,Parashurama,Vasudevaya,Narasimhadev,Matsya Avatara,Kalki Avatara,Subhadra',
	)
	expectToBe(
		count[`GROUP_CONCAT(newField, ' | ')`],
		'Krishna | Rama | Sita | Jaganatha | Parashurama | Vasudevaya | Narasimhadev | Matsya Avatara | Kalki Avatara | Subhadra',
	)
	expectToBe(count['COUNT(nullable)'], 3)
	console.log(' ')

	const boolCount = await t.aggregate('COUNT(*)').where('bool', '=', true).fetch()
	expectToBe(boolCount['COUNT(*)'], 3)
	console.log(' ')
}

const testSingleWheres = async (t: Table<'TestEntity2'>) => {
	console.log(styleLog('bold', '🧪 Single Wheres 2\n'))
	const isNull = await t.select('nullable').where('nullable', 'IS', 'NULL').fetch()
	expectCount(isNull, 7)
	console.log(' ')

	const notNull = await t.select('nullable').where('nullable', 'IS', 'NOT NULL').fetch()
	expectCount(notNull, 3)
	console.log(' ')

	const boolTrue = await t.select('bool').where('bool', '=', true).fetch()
	expectCount(boolTrue, 3)
	console.log(' ')

	const boolFalse = await t.select('bool').where('bool', '=', false).fetch()
	expectCount(boolFalse, 7)
	console.log(' ')

	const between = await t.select('number').where('number', 'BETWEEN', [4, 6]).fetch()
	expectCount(between, 4)
	console.log(' ')

	const notBetween = await t.select('number').where('number', 'NOT BETWEEN', [4, 6]).fetch()
	expectCount(notBetween, 6)
	console.log(' ')

	const IN = await t.select('newField').where('newField', 'IN', ['Hare', 'Krishna', 'Sita']).fetch()
	expectCount(IN, 2)
	console.log(' ')

	const notIN = await t
		.select('newField')
		.where('newField', 'NOT IN', ['Hare', 'Krishna', 'Sita'])
		.fetch()
	expectCount(notIN, 8)
	console.log(' ')

	const like = await t.select('id', 'string').where('string', 'LIKE', 'Om%').fetch()
	expectIDs(like, 7, 10)
	expectKeys(like, 'id', 'string')
	console.log(' ')
}

const testMultipleWheres = async (t: Table<'TestEntity2'>) => {
	console.log(styleLog('bold', '🧪 Multiple Wheres 2\n'))
	const oneAnd = await t
		.select()
		.where('bool', '=', false)
		.and('number', 'BETWEEN', [3, 8])
		.orderBy('number')
		.fetch()

	expectIDs(oneAnd, 1, 3, 4, 6, 8, 9)
	expectOrder(oneAnd, 'number')
	console.log('\n')

	const oneOr = await t
		.select()
		.where('bool', '=', true)
		.or('number', 'NOT BETWEEN', [3, 8])
		.orderBy('number DESC')
		.fetch()

	expectIDs(oneOr, 2, 5, 7, 10)
	expectOrder(oneOr, 'number', true)
	console.log(' ')

	const andOrQ = t.select()
	andOrQ.where('bool', '=', true).or('number', 'NOT BETWEEN', [3, 8])
	andOrQ.where('newField', 'IN', ['Hare', 'Krishna', 'Rama']).or('nullable', 'IS', 'NULL')

	const andOr = await andOrQ.fetch()
	expectIDs(andOr, 2, 5, 7, 10)
	console.log(' ')

	const match = await t
		.select()
		.match({ number: 7, bool: false, nullable: true, newField: 'Krishna' })
		.fetch()
	expectIDs(match, 1)
	console.log('\n')
}

const testLimitOffset = async (t: Table<'TestEntity2'>) => {
	console.log(styleLog('bold', '🧪 Limit Offset 2\n'))
	const limit = await t.select('id').orderBy('id').fetch(5)
	expectIDs(limit, 1, 2, 3, 4, 5)
	console.log(' ')

	const limitOffset = await t.select('id').orderBy('id').fetch(5, 5)
	expectIDs(limitOffset, 6, 7, 8, 9, 10)
	console.log('\n')
}
