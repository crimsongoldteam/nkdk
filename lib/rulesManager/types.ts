import { z } from "zod"

export const ZElementRule = z.object({
  nameEnterprise: z.string(),
  type: z.any(),
  typeEnterprise: z.any().optional(),
  format: z.function().optional(),
  inProperties: z.function(),
})

export const ZElementRules = z.record(z.string(), ZElementRule)

export type TElementRule = z.infer<typeof ZElementRule>
export type TElementRules = z.infer<typeof ZElementRules>
