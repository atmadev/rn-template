import * as React from 'react'
import { FlatList, ListRenderItem, StyleSheet } from 'react-native'

import { Text, View, TextInput } from 'components/Themed'
import { Profile } from 'shared/types'
import { searchProfile } from 'services/localDB'
import { createScreen } from 'screens/utils'

type ResultItem = Pick<Profile, 'uid' | 'firstName' | 'lastName' | 'spiritualName'>

export const SQLiteSearchProfileScreen = createScreen('SearchProfile', () => {
	const [result, setResult] = React.useState<ResultItem[]>([])
	const [searchString, setSearchString] = React.useState('')

	React.useEffect(() => {
		if (searchString.trim().length === 0) setResult([])
		else {
			searchProfile(searchString)
				.then((data) =>
					setSearchString((s) => {
						if (s === searchString) setResult(data)
						return s
					}),
				)
				.catch((e) => console.log('Fetch error', e))
		}
	}, [searchString])

	return (
		<View style={styles.container}>
			<TextInput style={styles.textInput} onChangeText={setSearchString} autoFocus />
			<FlatList
				style={styles.flatList}
				data={result}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
			/>
		</View>
	)
})

const renderItem: ListRenderItem<ResultItem> = ({ item }) => {
	return (
		<View style={styles.itemContainer}>
			<Text style={styles.itemText}>
				{item.spiritualName} ({item.firstName} {item.lastName})
			</Text>
		</View>
	)
}

const keyExtractor = (item: ResultItem) => item.uid

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center',
	},
	title: {
		fontSize: 30,
		fontWeight: '500',
		alignSelf: 'center',
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
		borderBottomColor: '#ccc',
	},
	flatList: { flex: 1 },
	itemContainer: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#ccc',
	},
	itemText: {
		fontSize: 18,
		marginHorizontal: 16,
		marginVertical: 10,
	},
})
