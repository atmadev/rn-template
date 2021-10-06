import * as React from 'react'
import { FlatList, ListRenderItem, StyleSheet, TextInput } from 'react-native'

import { Text, View } from 'components/Themed'
import { Profile, RootTabScreenProps } from 'shared/types'
import { setupDBForShapes, Table } from 'services/localDB/sqlite'
// import stubProfiles from './stubProfiles.json'

type ResultItem = Pick<Profile, 'id' | 'firstName' | 'lastName'>

export const SQLiteTestLabScreen = (_: RootTabScreenProps<'TabOne'>) => {
	const [result, setResult] = React.useState<ResultItem[]>([])
	const [searchString, setSearchString] = React.useState('')
	const [table, setTable] = React.useState<Table<'Profile'> | null>(null)

	React.useEffect(() => {
		setupDBForShapes('Profile')
			.then(async (db) => {
				// await db.table('Profile').createIndex('firstName', 'lastName')
				// await db.table('Profile').delete().run()
				// await db.table('Profile').insert(...stubProfiles)
				// TODO: prepare good stub data with all possible types
				// to test all possible operations in all possible type/operator combinations
				setTable(db.tables.Profile)
			})
			.catch((e) => console.log('Setup Shapes error', e))
	}, [])

	React.useEffect(() => {
		if (searchString.trim().length === 0) setResult([])
		else if (table) {
			table
				.select('id', 'firstName', 'lastName')
				.search(searchString, 'firstName', 'lastName')
				.orderBy('firstName', 'lastName')
				.limit(30)
				.fetch()
				.then((data) => setSearchString(s => {
					if (s === searchString) setResult(data)
					return s
				}))
				.catch((e) => console.log('Fetch error', e))
		}
	}, [table, searchString])

	return (
		<View style={styles.container}>
			{table ? (
				<>
					<TextInput
						style={styles.textInput}
						onChangeText={setSearchString}
					/>
					<FlatList style={styles.flatList} data={result} renderItem={renderItem} keyExtractor={keyExtractor} />
				</>
			) : (
				<Text style={styles.title}>🔄 Loading ...</Text>
			)}

		</View>
	)
}

const renderItem: ListRenderItem<ResultItem> = ({ item, index, separators }) => {
	return (
		<View style={styles.itemContainer}>
			<Text style={styles.itemText}>
				{item.firstName} {item.lastName}
			</Text>
		</View>
	)
}

const keyExtractor = (item: any) => item.id

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center',
	},
	title: {
		fontSize: 30,
		fontWeight: '500',
		alignSelf: 'center'
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: '80%',
	},
	textInput: {
		height: 44,
		fontSize: 18,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#cecece',
	},
	flatList: { flex: 1 },
	itemContainer: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#cecece',
	},
	itemText: {
		fontSize: 18,
		marginHorizontal: 16,
		marginVertical: 10,
	}
})
