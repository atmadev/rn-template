import { StatusBar } from 'expo-status-bar'
import * as React from 'react'
import { Platform } from 'react-native'

import { Text, View } from 'components/primitives'
import { createScreen, createStyles } from './utils'
import { store } from 'store'

export const ModalExample = createScreen('ModalExample', () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Modal</Text>
			<View style={styles.separator} />

			{/* Use a light status bar on iOS to account for the black space above the modal */}
			<StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
		</View>
	)
})

const styles = createStyles({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: () => ({
		fontSize: 20,
		fontWeight: 'bold',
		color: store.theme.text,
	}),
	separator: () => ({
		marginVertical: 30,
		height: 1,
		width: '80%',
		color: store.theme.separator,
	}),
})
