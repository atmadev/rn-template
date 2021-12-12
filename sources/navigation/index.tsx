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
import { ColorSchemeName, Pressable } from 'react-native'

import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme'
import ModalScreen from 'screens/ModalScreen'
import NotFoundScreen from 'screens/NotFoundScreen'
import { SQLiteTestLabScreenTest } from 'screens/SQLiteTestLab'
import TabTwoScreen from 'screens/TabTwoScreen'
import {
	RootStackParamList,
	RootTabParamList,
	RootTabScreenProps,
	SQLStackParamList,
} from 'shared/types'
import LinkingConfiguration from './LinkingConfiguration'
import { setNavigation } from './utils'

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
	return (
		<NavigationContainer
			ref={setNavigation}
			linking={LinkingConfiguration}
			theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
		>
			<RootNavigator />
		</NavigationContainer>
	)
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>()

function RootNavigator() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
			<Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
			<Stack.Group screenOptions={{ presentation: 'modal' }}>
				<Stack.Screen name="Modal" component={ModalScreen} />
			</Stack.Group>
		</Stack.Navigator>
	)
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>()

function BottomTabNavigator() {
	const colorScheme = useColorScheme()

	const options = React.useCallback(({ navigation }: RootTabScreenProps<'TabOne'>) => {
		const navigateModal = React.useCallback(() => navigation.navigate('Modal'), [])

		return {
			title: 'SQLite Test Lab',
			tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="database" color={color} />,
			headerRight: () => (
				<Pressable onPress={navigateModal} style={pressedStyle}>
					<FontAwesome
						name="info-circle"
						size={25}
						color={Colors[colorScheme].text}
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
				tabBarActiveTintColor: Colors[colorScheme].tint,
				headerShown: false,
			}}
		>
			<BottomTab.Screen name="TabOne" component={SQLStackNavigator} options={options} />
			<BottomTab.Screen
				name="TabTwo"
				component={TabTwoScreen}
				options={{
					title: 'Tab Two',
					tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
				}}
			/>
		</BottomTab.Navigator>
	)
}

const SQLStack = createNativeStackNavigator<SQLStackParamList>()

const SQLStackNavigator = () => (
	<SQLStack.Navigator>
		<SQLStack.Screen name="SQLTestLab" component={SQLiteTestLabScreenTest.component()} />
		{/* <SQLStack.Screen name="SearchProfile" component={SQLiteSearchProfileScreen.component} /> */}
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
