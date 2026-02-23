import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "../elements/baseElement/types"

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

export type ToNKDKResult = string[]

export type FormatElementFunction = (context: ConfigurationContext, element: NamedElement) => ToNKDKResult
export type CheckFormatFunction<T = NamedElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = NamedElement> = (element: T) => boolean
