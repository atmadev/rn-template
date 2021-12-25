import React, { useCallback } from 'react'
import { Button } from 'react-native'

import { View } from 'components/primitives'

import profiles from 'resources/profiles.json'
import profileConfigs from 'resources/profileConfigs.json'
import entries from 'resources/entries.json'
import { importEntries, importProfileConfigs, insertProfiles, runTest } from 'services/localDB'
import { createScreen, createStyles } from 'screens/utils'
import { SQLiteSearchProfile } from './SearchProfileScreen'
import { store } from 'store'

export const SQLiteTestLab = createScreen('SQLTestLab', () => {
	const openSearchProfile = useCallback(() => {
		SQLiteSearchProfile.navigate()
	}, [])

	return (
		<View style={styles.container}>
			<Button title="Init Data" onPress={initData} />
			<Button title="Search Profile" onPress={openSearchProfile} />
			<Button title="Run Test" onPress={runTest} />
		</View>
	)
})

const initData = async () => {
	await insertProfiles(profiles)
	await importProfileConfigs(profileConfigs as any)
	await importEntries(entries as any)
	console.log('initData Done')
}

const styles = createStyles({
	container: () => ({
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center',
		backgroundColor: store.theme.background,
	}),
})
