import { ExpandDeep, ShapedNamed } from './primitives'

import * as aShapes from './shapes'

export type Profile = ExpandDeep<ShapedNamed<'Profile'>>
export type ProfileConfig = ExpandDeep<ShapedNamed<'ProfileConfig'>>
export type Entry = ExpandDeep<ShapedNamed<'Entry'>>
export type TestEntity = ExpandDeep<ShapedNamed<'TestEntity'>>

export const shapes = aShapes
