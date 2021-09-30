import * as React from 'react'
import { StyleSheet } from 'react-native'

import { Text, View } from 'components/Themed'
import { RootTabScreenProps } from 'shared/types'
import { setupDBForShapes } from 'services/localDB/sqlite'

export const TabOneScreen = (_: RootTabScreenProps<'TabOne'>) => {
	setupDBForShapes('Profile', 'Country')
		.then(async (db) => {
			console.log('db', JSON.stringify(db, undefined, 2))

			const result = await db.table('Profile').select().fetch()
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
