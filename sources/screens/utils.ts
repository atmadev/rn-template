import { FC, createElement } from 'react'

import { observer } from 'mobx-react-lite'
import { navigation } from 'navigation/utils'

export const createScreen = <Props>(name: string, rawComponent: FC<Props>) => ({
	name,
	// @ts-ignore
	component: () => observer(({ route: { params } }) => createElement(rawComponent, params)),
	navigate: (props: Props) => navigation!.navigate(name, props),
})
