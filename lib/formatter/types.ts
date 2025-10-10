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

const ZI8nTextEnterprise = z.union([z.string(), z.record(z.string(), z.string())])
export type TI8nTextEnterprise = z.infer<typeof ZI8nTextEnterprise>
