import * as React from 'react'

import { Text, View } from 'components/primitives'
import { store } from 'store'
import { createScreen, createStyles } from './utils'

export const TabTwo = createScreen('TabTwo', () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Tab Two</Text>
			<View style={styles.separator} />
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
