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
