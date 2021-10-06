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
			// TODO: prepare good stub data with all possible types
			// to test all possible operations in all possible type/operator combinations
			const profiles = db.tables.Profile

			const searchString = 's'

			const q = profiles.select('id', 'firstName', 'lastName', 'bio')

			q.where('bio', 'IS', 'NOT NULL')
				.and('id', '<>', '23')
				.and('age', 'BETWEEN', [18, 25])
				.and('countryId', 'LIKE', '615ac07f%')

			if (searchString)
				q.where('firstName', 'LIKE', `${searchString}%`).or('lastName', 'LIKE', `${searchString}%`)

			const result = await q.run()
			console.log('result count', result.length)
			// console.log('result', result)
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
