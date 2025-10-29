import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { z } from "zod"

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

export const ZBoolEnterprise = z.enum(["Истина", "Ложь"])
export type TBoolEnterprise = z.infer<typeof ZBoolEnterprise>

export interface IFormatElementResult {
  strings: string[]
  haveSimpleHorizontalGroup: boolean
}

export type FormatFunction<T = TBaseElement> = (element: T, params: IFormatterParams) => IFormatElementResult
export type CheckFormatFunction<T = TBaseElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = TBaseElement> = (element: T) => boolean
