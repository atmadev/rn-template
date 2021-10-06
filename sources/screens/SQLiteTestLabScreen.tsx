import * as React from 'react'
import { FlatList, ListRenderItem, StyleSheet, TextInput } from 'react-native'

import { Text, View } from 'components/Themed'
import { Profile, RootTabScreenProps } from 'shared/types'
import { setupDBForShapes, Table } from 'services/localDB/sqlite'
// import stubProfiles from './stubProfiles.json'

// @ts-ignore
import debounced from 'lodash/debounce'

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
				.then(setResult)
				.catch((e) => console.log('Fetch error', e))
		}
	}, [table, searchString])

	const onChangeTextDebounced = React.useCallback(
		debounced((text: string) => {
			setSearchString(text)
		}, 50),
		[],
	)

	return table ? (
		<View style={styles.container}>
			<TextInput
				style={{
					height: 44,
					fontSize: 18,
					paddingHorizontal: 16,
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderBottomColor: '#cecece',
				}}
				onChangeText={onChangeTextDebounced}
			/>
			<FlatList style={{ flex: 1 }} data={result} renderItem={renderItem} />
		</View>
	) : (
		<Text style={styles.title}>🔄 Loading ...</Text>
	)
}

const renderItem: ListRenderItem<ResultItem> = ({ item, index, separators }) => {
	return (
		<View
			style={{
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: '#cecece',
			}}
		>
			<Text
				style={{
					fontSize: 18,
					marginHorizontal: 16,
					marginVertical: 10,
				}}
			>
				{item.firstName} {item.lastName}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: '80%',
	},
})
