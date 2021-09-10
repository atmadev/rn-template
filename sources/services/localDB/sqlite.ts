import { openDatabase } from 'expo-sqlite'
import { Profile } from 'shared/types'

const db = openDatabase('db')

type Notted<T extends string> = T | `NOT ${T}`

type BasicOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
type BetweenOperator = Notted<'BETWEEN'>
type InOperator = Notted<'IN'>
type LikeOperator = Notted<'LIKE'>
type IsOperator = 'IS'
type IsValue = Notted<'NULL'>
type Operator = BasicOperator | InOperator | LikeOperator | BetweenOperator | IsOperator
type ColumnTypes = number | string | boolean

type OnlyAllowedTypes<T> = { [P in keyof T as T[P] extends ColumnTypes ? P : never]: T[P] }

type WhereItem<T> = {
	key: keyof T
	operator: Operator
	value: any
}

class Query<A, T = OnlyAllowedTypes<A>> {
	props: (keyof T)[] = []
	private whereItems: WhereItem<T>[] = []
	readonly table: string

	constructor(table: string) {
		this.table = table
	}

	get structured() {
		return (
			`SELECT ${this.props.length > 0 ? this.props.join(',') : '*'} FROM ${this.table}` +
			(this.whereItems.length > 0
				? ' WHERE ' +
				  this.whereItems
						.map((i) => {
							const string = i.key + ' ' + i.operator + ' '
							if (i.operator.includes('BETWEEN')) return string + i.value[0] + ' AND ' + i.value[1]
							else if (i.operator.includes('IN')) return string + "('" + i.value.join("','") + "')"
							else if (i.operator.includes('LIKE')) return string + "'" + i.value + "'"
							else return string + i.value
						})
						.join(' AND ')
				: '')
		)
	}

	where = <P extends keyof T, O extends Operator, V extends T[P]>(
		key: P,
		operator: O,
		value: O extends InOperator
			? V[]
			: O extends BetweenOperator
			? [V, V]
			: O extends LikeOperator
			? string
			: O extends IsOperator
			? IsValue
			: V,
	) => {
		this.whereItems.push({ key, operator, value })
		return { and: this.where }
	}
}

const q = new Query<Profile>('some_table')
q.props = ['firstName', 'id']
q.where('firstName', 'NOT LIKE', 's%')
	.and('age', '>=', 22)
	.and('age', 'NOT BETWEEN', [1, 2])
	.and('lastName', 'IN', ['Alex', 'Julia'])
	.and('male', '=', true)
	.and('id', '=', 'ffew')
	.and('lastName', 'IS', 'NULL')
