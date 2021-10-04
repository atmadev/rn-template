import * as React from 'react'
import { StyleSheet } from 'react-native'

import { Text, View } from 'components/Themed'
import { RootTabScreenProps } from 'shared/types'
import { setupDBForShapes } from 'services/localDB/sqlite'

export const SQLiteTestLabScreen = (_: RootTabScreenProps<'TabOne'>) => {
	setupDBForShapes('Profile', 'Country')
		.then(async (db) => {
			const result = await db
				.table('Profile')
				.select()
				.fetch()
			console.log('result', result)
			/*
			db.table('Profile')
				.insert(
					{
						id: '1',
						firstName: 'John',
						lastName: 'Smith',
						createdAt: Date.now(),
						numbers: [1, 2],
						male: true,
						age: 12,
						countryId: '2',
						settings: {
							pushNotification: true,
						},
						interests: ['Yoga', 'Meditation', 'Prasadam'],
					},
					{
						id: '2',
						firstName: 'Valera',
						lastName: 'Ivanov',
						createdAt: Date.now(),
						numbers: [3, 4],
						male: true,
						age: 13,
						countryId: '1',
						settings: {
							pushNotification: false,
						},
						interests: ['Sankirtanam', 'Vishnu Smaranam', 'Prasada Sevanam'],
					},
				)
				.catch((e) => console.log('insert error', e))
				*/
		})
		.catch((e) => console.log('Setup Shapes error', e))

	return (
		<View style={styles.container}>
			<Text style={styles.title}>SQLite Test Lab</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
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
