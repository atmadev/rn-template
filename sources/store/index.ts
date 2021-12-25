import { colors } from 'constants/Colors'
import { makeAutoObservable } from 'mobx'
import { ColorSchemeName } from 'react-native'

class Store {
	constructor() {
		makeAutoObservable(this)
	}

	inited = false
	setInited = () => (this.inited = true)

	colorScheme: ColorSchemeName = null
	setColorScheme = (scheme: ColorSchemeName) => (this.colorScheme = scheme)

	get theme() {
		return this.colorScheme === 'dark' ? colors.dark : colors.light
	}
}

export const store = new Store()
