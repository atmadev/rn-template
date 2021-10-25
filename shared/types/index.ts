/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ExpandDeep, Shaped } from './primitives'

import * as aShapes from './shapes'

export type RootStackParamList = {
	Root: NavigatorScreenParams<RootTabParamList> | undefined
	Modal: undefined
	NotFound: undefined
}

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
	RootStackParamList,
	Screen
>

export type RootTabParamList = {
	TabOne: undefined
	TabTwo: undefined
}

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
	BottomTabScreenProps<RootTabParamList, Screen>,
	NativeStackScreenProps<RootStackParamList>
>

export type Profile = ExpandDeep<Shaped<'Profile'>>
export type Entry = ExpandDeep<Shaped<'Entry'>>

export const shapes = aShapes