import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initLocalDB } from 'services/localDB'

import useCachedResources from './sources/hooks/useCachedResources'
import useColorScheme from './sources/hooks/useColorScheme'
import Navigation from './sources/navigation'

export default function App() {
	const isLoadingComplete = useCachedResources()
	const colorScheme = useColorScheme()
	const [inited, setInited] = useState(false)

	useEffect(() => {
		Promise.all([initLocalDB()])
			.then(() => setInited(true))
			.catch((e) => console.log('Init ERROR', e))
	}, [])

	if (!isLoadingComplete || !inited) {
		return null
	} else {
		return (
			<SafeAreaProvider>
				<Navigation colorScheme={colorScheme} />
				<StatusBar />
			</SafeAreaProvider>
		)
	}
}
