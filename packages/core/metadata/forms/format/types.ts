import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "../elements/baseElement/types"
import { PropertyRule } from "../elements/calendarField/rules"

export enum WrapInGroupStrategy {
  None,
  Always,
  Auto,
}

export interface IFormatterParams {
  wrapInGroup?: WrapInGroupStrategy
  level?: number
  isFirst?: boolean
}

export interface IFormatElementResult {
  strings: string[]
  haveSimpleHorizontalGroup: boolean
}

export type FormatElementFunction = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: NamedElement
) => IFormatElementResult
export type CheckFormatFunction<T = NamedElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = NamedElement> = (element: T) => boolean
