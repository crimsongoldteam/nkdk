import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "../elements/baseElement/types"

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

export type FormatElementFunction = (context: ConfigurationContext, element: BaseElement) => IFormatElementResult
export type CheckFormatFunction<T = BaseElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = BaseElement> = (element: T) => boolean
