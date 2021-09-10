import { openDatabase } from 'expo-sqlite'
import { Profile } from 'shared/types'

const db = openDatabase('db')

type BasicOperator = '=' | '>' | '<' | '>=' | '<=' | '<>'
type MultiOperator = 'BETWEEN' | 'NOT BETWEEN' | 'IN' | 'NOT IN'
type LikeOperator = 'LIKE' | 'NOT LIKE'
type Operator = BasicOperator | MultiOperator | LikeOperator

type WhereItem<T> = {
	key: keyof T
	operator: Operator
	value: any
	not?: true
}

class Query<T> {
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
							if (i.operator === 'BETWEEN') return string + i.value[0] + ' AND ' + i.value[1]
							else if (i.operator === 'IN') return string + '(' + i.value.join(',') + ')'
							else return string + i.value
						})
						.join(' AND ')
				: '')
		)
	}

	where = <K extends keyof T, O extends Operator, V = T[K]>(
		key: K,
		operator: O,
		value: O extends MultiOperator ? V[] : O extends LikeOperator ? string : V,
	) => {
		this.whereItems.push({ key, operator, value })
		return { and: this.where }
	}
}

const q = new Query<Profile>('some_table')
q.props = ['firstName', 'id']
q.where('firstName', 'NOT LIKE', 's%').and('age', '>=', 22).and('age', 'NOT BETWEEN', [1, 2])
