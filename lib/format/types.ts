import { TElement } from "../metadata/forms/elements/element/types"
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

export type FormatFunction<T = TElement> = (element: T, params: IFormatterParams) => string[]
export type CheckFormatFunction<T = TElement> = (element: T) => boolean

export type CheckIsOneLineElementFunction<T = TElement> = (element: T) => boolean
