import * as React from 'react'
import { StyleSheet } from 'react-native'

import { Text, View } from 'components/Themed'
import { RootTabScreenProps } from 'shared/types'
import { setupDBForShapes } from 'services/localDB/sqlite'
// import stubProfiles from './stubProfiles.json'

export const SQLiteTestLabScreen = (_: RootTabScreenProps<'TabOne'>) => {
	setupDBForShapes('Profile', 'Country')
		.then(async (db) => {
			// await db.table('Profile').createIndex('firstName', 'lastName')
			// await db.table('Profile').delete().run()
			// await db.table('Profile').insert(...stubProfiles)

			const q = db
				.table('Profile')
				.select('firstName', 'lastName', 'age', 'male')
				.where('bio', 'IS', 'NOT NULL')
				.where('male', '=', true)
				.where('age', 'BETWEEN', [18, 25])
				.where('countryId', 'LIKE', '615ac07f%')
				.where('firstName', 'IN', ['Jannie', 'Stella', 'Johnson', 'Fowler'])

			const result = await q.run()
			console.log('result count', result.length)
			console.log('result', result)
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
