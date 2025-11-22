import { TConfigurationSettings } from "../metadata/configurationSettings/types"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"

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
  element: TBaseElement,
  configurationSettings: TConfigurationSettings
) => IFormatElementResult
export type CheckFormatFunction<T = TBaseElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = TBaseElement> = (
  element: T
) => boolean
