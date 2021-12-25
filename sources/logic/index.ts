import { FontAwesome } from '@expo/vector-icons'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { initLocalDB } from 'services/localDB'
import { store } from 'store'

export const initApp = async () => {
	try {
		SplashScreen.preventAutoHideAsync()

		// Load fonts
		await Promise.all([
			Font.loadAsync({
				...FontAwesome.font,
				'space-mono': require('assets/fonts/SpaceMono-Regular.ttf'),
			}),
			initLocalDB(),
		])

		store.setInited()
	} catch (e) {
		// We might want to provide this error information to an error reporting service
		console.warn(e)
	} finally {
		SplashScreen.hideAsync()
	}
}
