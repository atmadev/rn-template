import { Table } from './sqlite'
import testEntities from 'resources/testEntities.json'
import { TestEntity } from 'shared/types'

export const runTest = async (t: Table<'TestEntity'>) => {
	try {
		await t.delete().run()
		const emptyCount = await t.aggregate('COUNT(*)').fetch()
		expectToBe(emptyCount['COUNT(*)'], 0)

		await t.insert(...(testEntities as unknown as TestEntity[]))
		// prettier-ignore
		const count = await t.aggregate(
			'COUNT(*)','AVG(number)','GROUP_CONCAT(DISTINCT word)',`GROUP_CONCAT(word, ' | ')`).fetch()
		// console.log(count)
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

		// const entities = await TestEntity.select().fetch()
		// log(entities)

		const isNull = await t.select('nullable').where('nullable', 'IS', 'NULL').fetch()
		expectCount(isNull, 7)

		const notNull = await t.select('nullable').where('nullable', 'IS', 'NOT NULL').fetch()
		expectCount(notNull, 3)

		const boolTrue = await t.select('boolean').where('boolean', '=', true).fetch()
		expectCount(boolTrue, 3)

		const boolFalse = await t.select('boolean').where('boolean', '=', false).fetch()
		expectCount(boolFalse, 7)

		const between = await t.select('number').where('number', 'BETWEEN', [4, 6]).fetch()
		expectCount(between, 4)

		const notBetween = await t.select('number').where('number', 'NOT BETWEEN', [4, 6]).fetch()
		expectCount(notBetween, 6)

		const IN = await t.select('word').where('word', 'IN', ['Hare', 'Krishna', 'Rama']).fetch()
		expectCount(IN, 5)

		const notIN = await t
			.select('word')
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
