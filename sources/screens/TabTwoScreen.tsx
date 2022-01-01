import * as React from 'react'

import { Text, View } from 'components/primitives'
import { store } from 'store'
import { createScreen, createStyles } from './utils'
import {
	entries,
	login,
	me,
	postEntry,
	refreshToken,
	updateEntry,
	updateOptions,
} from 'services/network/vs'
import { Button } from 'react-native'

export const TabTwo = createScreen('TabTwo', () => {
	const loginCallback = React.useCallback(() => login('sanio91@ya.ru', 'Ale248Vai'), [])
	const meCallback = React.useCallback(() => me(), [])
	const refreshTokenCallback = React.useCallback(() => refreshToken(), [])
	const entriesCallback = React.useCallback(
		() =>
			entries('398', {
				year: 2021,
				month: 12,
			}),
		[],
	)
	const postEntryCallback = React.useCallback(() => {
		postEntry('398', {
			entrydate: '2021-12-26',
			kirtan: '1',
		})
	}, [])
	const updateEntryCallback = React.useCallback(() => {
		updateEntry('398', {
			entry_id: '560562',
			entrydate: '2021-12-26',
			jcount_730: '16',
		})
	}, [])
	const updateOptionsCallback = React.useCallback(() => {
		updateOptions({
			userid: '398',
			opt_lections: false,
		})
	}, [])

	return (
		<View style={styles.container}>
			<Text style={styles.title}>VS API</Text>
			<View style={styles.separator} />
			<Button title="Login" onPress={loginCallback} />
			<Button title="Me" onPress={meCallback} />
			<Button title="Refresh Token" onPress={refreshTokenCallback} />
			<Button title="Entries" onPress={entriesCallback} />
			<Button title="Post Entry" onPress={postEntryCallback} />
			<Button title="Update Entry" onPress={updateEntryCallback} />
			<Button title="Update Options" onPress={updateOptionsCallback} />
		</View>
	)
})

const styles = createStyles({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	separator: () => ({
		marginVertical: 30,
		height: 1,
		width: '80%',
		color: store.theme.separator,
	}),
})
