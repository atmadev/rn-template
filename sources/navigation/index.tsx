/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as React from 'react'
import { Pressable } from 'react-native'

import { ModalExample } from 'screens/ModalExample'
import { SQLiteTestLab } from 'screens/SQLiteTestLab'
import { SQLiteSearchProfile } from 'screens/SQLiteTestLab/SearchProfileScreen'
import { TabTwo } from 'screens/TabTwoScreen'
import { setNavigation } from './utils'
import { store } from 'store'
import { observer } from 'mobx-react-lite'

export const Navigation = observer(() => {
	return (
		<NavigationContainer
			ref={setNavigation}
			theme={store.colorScheme === 'dark' ? DarkTheme : DefaultTheme}
		>
			<Stack.Navigator>
				<Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
				<Stack.Group screenOptions={{ presentation: 'modal' }}>
					<Stack.Screen {...ModalExample.Screen} />
				</Stack.Group>
			</Stack.Navigator>
		</NavigationContainer>
	)
})

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator()

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator()

const BottomTabNavigator = () => {
	const options = React.useCallback(() => {
		const navigateModal = React.useCallback(() => ModalExample.navigate(), [])

		return {
			title: 'SQLite Test Lab',
			tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="database" color={color} />,
			headerRight: () => (
				<Pressable onPress={navigateModal} style={pressedStyle}>
					<FontAwesome
						name="info-circle"
						size={25}
						color={store.theme.text}
						style={{ marginRight: 15 }}
					/>
				</Pressable>
			),
		}
	}, [])

	return (
		<BottomTab.Navigator
			initialRouteName="TabOne"
			screenOptions={{
				tabBarActiveTintColor: store.theme.tint,
				headerShown: false,
			}}
		>
			<BottomTab.Screen name="TabOne" component={SQLStackNavigator} options={options} />
			<BottomTab.Screen
				{...TabTwo.Screen}
				options={{
					title: 'Tab Two',
					tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
				}}
			/>
		</BottomTab.Navigator>
	)
}

const SQLStack = createNativeStackNavigator()

const SQLStackNavigator = () => (
	<SQLStack.Navigator>
		<SQLStack.Screen {...SQLiteTestLab.Screen} />
		<SQLStack.Screen {...SQLiteSearchProfile.Screen} />
	</SQLStack.Navigator>
)

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
	name: React.ComponentProps<typeof FontAwesome>['name']
	color: string
}) {
	return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />
}

const pressedStyle = ({ pressed }: { pressed: boolean }) => ({
	opacity: pressed ? 0.5 : 1,
})
