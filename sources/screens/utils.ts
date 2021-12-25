import { FC, createElement } from 'react'

import { observer } from 'mobx-react-lite'
import { navigation } from 'navigation/utils'

import { computed } from 'mobx'
import { ViewStyle, TextStyle, ImageStyle } from 'react-native'
import { store } from 'store'

export const createScreen = <Props = void>(name: string, rawComponent: FC<Props>) => ({
	Screen: {
		name,
		get component() {
			// @ts-ignore
			return observer(({ route: { params } }) => createElement(rawComponent, params))
		},
	},
	navigate: (props: Props) => navigation!.navigate(name, props),
})

export type Style = ViewStyle | TextStyle | ImageStyle

export type Dynamic<T> = T | (() => T)

type DynamicStyle = Dynamic<Style>
type DynamicStyles = { [key: string]: DynamicStyle }

export const createStyles = <T extends DynamicStyles>(styles: T) => {
	Object.entries(Object.getOwnPropertyDescriptors(styles)).forEach(([key, descriptor]) => {
		const func = descriptor.value instanceof Function ? descriptor.value : null
		// @ts-ignore
		if (func) styles[key] = dynamicStyle(func)
	})
	return styles
}

const dynamicStyle = (creator: () => Style) => {
	const computedStyle = computed(creator)

	return () => (store.inited ? computedStyle.get() : {})
}
