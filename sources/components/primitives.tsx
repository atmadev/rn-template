import React, { FC } from 'react'
import {
	Image as RNImage,
	ImageProps,
	ImageStyle,
	Text as RNText,
	TextStyle,
	TextProps,
	View as RNView,
	ViewProps,
	ViewStyle,
	TextInput as RNTextInput,
	TextInputProps,
} from 'react-native'

import { observer } from 'mobx-react-lite'
import { Dynamic } from 'screens/utils'

export const View: FC<Omit<ViewProps, 'style'> & { style: Dynamic<ViewStyle> }> = observer(
	(props) => {
		const { style, ...restProps } = props
		const finalStyle = style instanceof Function ? style() : style

		return <RNView style={finalStyle} {...restProps} />
	},
)

export const Text: FC<Omit<TextProps, 'style'> & { style: Dynamic<TextStyle> }> = observer(
	(props) => {
		const { style, ...restProps } = props
		const finalStyle = style instanceof Function ? style() : style

		return <RNText style={finalStyle} {...restProps} />
	},
)

export const Image: FC<Omit<ImageProps, 'style'> & { style: Dynamic<ImageStyle> }> = observer(
	(props) => {
		const { style, ...restProps } = props
		const finalStyle = style instanceof Function ? style() : style

		return <RNImage style={finalStyle} {...restProps} />
	},
)

export const TextInput: FC<Omit<TextInputProps, 'style'> & { style: Dynamic<TextStyle> }> =
	observer((props) => {
		const { style, ...restProps } = props
		const finalStyle = style instanceof Function ? style() : style

		return <RNTextInput style={finalStyle} {...restProps} />
	})
