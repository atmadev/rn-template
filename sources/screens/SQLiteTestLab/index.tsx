import * as React from 'react'
import { Button, StyleSheet } from 'react-native'

import { View } from 'components/Themed'
import { SQLStackScreenProps } from 'shared/types'
import { useCallback } from 'react'

import profiles from 'resources/profiles.json'
import profileConfigs from 'resources/profileConfigs.json'
import entries from 'resources/entries.json'
import { importEntries, importProfileConfigs, insertProfiles, runTest } from 'services/localDB'
import { createScreen } from 'screens/utils'

export const SQLiteTestLabScreen = (_: SQLStackScreenProps<'SQLTestLab'>) => {
	const openSearchProfile = useCallback(() => {
		_.navigation.navigate('SearchProfile')
	}, [])

	return (
		<View style={styles.container}>
			<Button title="Init Data" onPress={initData} />
			<Button title="Search Profile" onPress={openSearchProfile} />
			<Button title="Run Test" onPress={runTest} />
		</View>
	)
}

const initData = async () => {
	await insertProfiles(profiles)
	await importProfileConfigs(profileConfigs as any)
	await importEntries(entries as any)
	console.log('initData Done')
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center',
	},
})
export const SQLiteTestLabScreenTest = createScreen('SQLTestLab', SQLiteTestLabScreen)
