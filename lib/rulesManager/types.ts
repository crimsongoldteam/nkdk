import { z } from "zod"
import { TConfigurationSettings } from "../metadata/configurationSettings/types"

export type TFormatFunction = (
  value: any,
  configurationSettings: TConfigurationSettings,
  rule?: TElementRule
) => any

export type TParseFunction = (
  value: any,
  configurationSettings: TConfigurationSettings,
  rule?: TElementRule
) => any

export const ZElementRule = z.object({
  nameEnterprise: z.string(),
  type: z.any(),
  typeEnterprise: z.any().optional(),
  format: z.custom<TFormatFunction>().optional(),
  formatProperties: z.custom<TFormatFunction>().optional(),
  parseProperties: z.custom<TParseFunction>().optional(),
  inProperties: z.function(),
})

export const ZElementRules = z.record(z.string(), ZElementRule)

export type TElementRule = z.infer<typeof ZElementRule>
export type TElementRules = z.infer<typeof ZElementRules>
