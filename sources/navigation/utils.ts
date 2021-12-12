import { NavigationContainerRef } from '@react-navigation/native'

export let navigation: NavigationContainerRef<any> | null = null
export const setNavigation = (n: any) => (navigation = n)
export const goBack = () => navigation?.goBack()
// export const resetNavigation = (name: string) =>
// navigationContainer.reset({ index: 0, routes: [{ name }] })
