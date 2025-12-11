import { z } from "zod"

const ZI8nTextLanguageXML = z.object({
  "v8:lang": z.string(),
  "v8:content": z.string(),
})

const ZI8nTextItemXML = z.object({
  "@attributes": z
    .object({
      formatted: z.boolean().optional(),
    })
    .optional(),
  "v8:item": ZI8nTextLanguageXML.optional(),
})

export const ZI8nTextXML = z.array(ZI8nTextItemXML)

export const ZI8nText = z.object({
  formatted: z.boolean().optional(),
  items: z.record(z.string(), z.string()),
})

export const ZI8nTextEnterprise = z.union([
  z.string(),
  z.record(z.string(), z.string()),
])

export type TI8nText = z.infer<typeof ZI8nText>
export type TI8nTextXML = z.infer<typeof ZI8nTextXML>
export type TI8nTextEnterprise = z.infer<typeof ZI8nTextEnterprise>
