import { z } from "zod"

export const ZI8nText = z.object({
  formatted: z.boolean().optional(),
  items: z.record(z.string(), z.string()),
})

export const ZI8nTextEnterprise = z.union([z.string(), z.record(z.string(), z.string())])

export const ZI8nTextXML = z.object({
  _formatted: z.boolean().optional(),
  "v8:item": z.array(
    z.object({
      "v8:lang": z.string(),
      "v8:content": z.string(),
    })
  ),
})

export type TI8nText = z.infer<typeof ZI8nText>
export type TI8nTextEnterprise = z.infer<typeof ZI8nTextEnterprise>
export type TI8nTextXML = z.infer<typeof ZI8nTextXML>
