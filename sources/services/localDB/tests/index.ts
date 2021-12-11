import { Table } from '../sqlite'
import testEntities from 'resources/testEntities.json'
import { TestEntity } from 'shared/types'
import { expectToBe, expectCount, expectIDs, expectOrder, expectKeys } from './utils'
import { styleLog } from 'shared/utils'

export const runTest = async (t: Table<'TestEntity'>) => {
	await setUpTestData(t)
	await testAggregateFunctions(t)
	await testSingleWheres(t)
	await testMultipleWheres(t)
	await testLimitOffset(t)
}

const setUpTestData = async (t: Table<'TestEntity'>) => {
	await t.delete().run()
	const emptyCount = await t.aggregate('COUNT(*)').fetch()
	expectToBe(emptyCount['COUNT(*)'], 0)
	console.log(' ')
	await t.insert(...(testEntities as unknown as TestEntity[]))
	console.log('\n')
}

const testAggregateFunctions = async (t: Table<'TestEntity'>) => {
	console.log(styleLog('bold', '🧪 Aggregate Functions\n'))
	// prettier-ignore
	const count = await t.aggregate(
				'COUNT(*)','AVG(number)','GROUP_CONCAT(DISTINCT word)',`GROUP_CONCAT(word, ' | ')`, 'COUNT(nullable)').fetch()
	expectToBe(count['COUNT(*)'], 10)
	expectToBe(count['AVG(number)'], 6)
	expectToBe(
		count[`GROUP_CONCAT(DISTINCT word)`],
		'Vasudeva,Hare,Krishna,Rama,Sita,Hari,Om,Chaytanya',
	)
	expectToBe(
		count[`GROUP_CONCAT(word, ' | ')`],
		'Vasudeva | Hare | Krishna | Rama | Sita | Krishna | Hari | Om | Rama | Chaytanya',
	)
	expectToBe(count['COUNT(nullable)'], 3)
	console.log(' ')

	const boolCount = await t.aggregate('COUNT(*)').where('boolean', '=', true).fetch()
	expectToBe(boolCount['COUNT(*)'], 3)
	console.log('\n')
}

const testSingleWheres = async (t: Table<'TestEntity'>) => {
	console.log(styleLog('bold', '🧪 Single Wheres\n'))
	const isNull = await t.select('nullable').where('nullable', 'IS', 'NULL').fetch()
	expectCount(isNull, 7)
	console.log(' ')

	const notNull = await t.select('nullable').where('nullable', 'IS', 'NOT NULL').fetch()
	expectCount(notNull, 3)
	console.log(' ')

	const boolTrue = await t.select('boolean').where('boolean', '=', true).fetch()
	expectCount(boolTrue, 3)
	console.log(' ')

	const boolFalse = await t.select('boolean').where('boolean', '=', false).fetch()
	expectCount(boolFalse, 7)
	console.log(' ')

	const between = await t.select('number').where('number', 'BETWEEN', [4, 6]).fetch()
	expectCount(between, 4)
	console.log(' ')

	const notBetween = await t.select('number').where('number', 'NOT BETWEEN', [4, 6]).fetch()
	expectCount(notBetween, 6)
	console.log(' ')

	const IN = await t.select('word').where('word', 'IN', ['Hare', 'Krishna', 'Rama']).fetch()
	expectCount(IN, 5)
	console.log(' ')

	const notIN = await t.select('word').where('word', 'NOT IN', ['Hare', 'Krishna', 'Rama']).fetch()
	expectCount(notIN, 5)
	console.log(' ')

	const like = await t.select('id', 'string').where('string', 'LIKE', 'Om%').fetch()
	expectIDs(like, 7, 10)
	expectKeys(like, 'id', 'string')
	console.log('\n')
}

const testMultipleWheres = async (t: Table<'TestEntity'>) => {
	console.log(styleLog('bold', '🧪 Multiple Wheres\n'))
	const oneAnd = await t
		.select()
		.where('boolean', '=', false)
		.and('number', 'BETWEEN', [3, 8])
		.orderBy('number')
		.fetch()

	expectIDs(oneAnd, 1, 3, 4, 6, 8, 9)
	expectOrder(oneAnd, 'number')
	console.log(' ')

	const oneOr = await t
		.select()
		.where('boolean', '=', true)
		.or('number', 'NOT BETWEEN', [3, 8])
		.orderBy('number DESC')
		.fetch()

	expectIDs(oneOr, 2, 5, 7, 10)
	expectOrder(oneOr, 'number', true)
	console.log(' ')

	const andOrQ = t.select()
	andOrQ.where('boolean', '=', true).or('number', 'NOT BETWEEN', [3, 8])
	andOrQ.where('word', 'IN', ['Hare', 'Krishna', 'Rama']).or('nullable', 'IS', 'NULL')

	const andOr = await andOrQ.fetch()
	expectIDs(andOr, 2, 5, 7, 10)
	console.log(' ')

	const match = await t
		.select()
		.match({ number: 7, boolean: false, nullable: true, word: 'Vasudeva' })
		.fetch()
	expectIDs(match, 1)
	console.log('\n')
}

const testLimitOffset = async (t: Table<'TestEntity'>) => {
	console.log(styleLog('bold', '🧪 Limit Offset\n'))
	const limit = await t.select('id').orderBy('id').fetch(5)
	expectIDs(limit, 1, 2, 3, 4, 5)
	console.log(' ')

	const limitOffset = await t.select('id').orderBy('id').fetch(5, 5)
	expectIDs(limitOffset, 6, 7, 8, 9, 10)
	console.log('\n')
}
