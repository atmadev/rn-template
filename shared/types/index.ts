import { ExpandDeep, ShapedNamed } from './primitives'

export type Profile = ExpandDeep<ShapedNamed<'Profile'>>
export type ProfileConfig = ExpandDeep<ShapedNamed<'ProfileConfig'>>
export type Entry = ExpandDeep<ShapedNamed<'Entry'>>
export type TestEntity = ExpandDeep<ShapedNamed<'TestEntity'>>
