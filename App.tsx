import React, { FC, useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { observer } from 'mobx-react-lite'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { StatusBar } from 'expo-status-bar'

import { store } from 'store'
import { Navigation } from 'navigation'
import { initApp } from 'logic'

const App = observer(() => {
	useEffect(() => {
		initApp()
	}, [])

	return store.inited ? (
		<SafeAreaProvider>
			<Navigation />
			<StatusBar />
			<Hooks />
		</SafeAreaProvider>
	) : null
})

const Hooks: FC = () => {
	const colorScheme = useColorScheme()

	useEffect(() => {
		store.setColorScheme(colorScheme)
	}, [colorScheme])

	return null
}

export default App
