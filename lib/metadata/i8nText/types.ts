import { z } from "zod"

export const ZI8nText = z.record(z.string(), z.string())

const ZI8nTextEnterprise = z.union([z.string(), z.record(z.string(), z.string())])

export const ZV8ItemXML = z.object({
  "v8:item": z.object({
    "v8:lang": z.string(),
    "v8:content": z.string(),
  }),
})

export const ZI8nTextXML = z.array(ZV8ItemXML)

export type TI8nText = z.infer<typeof ZI8nText>
export type TI8nTextEnterprise = z.infer<typeof ZI8nTextEnterprise>
export type TI8nTextXML = z.infer<typeof ZI8nTextXML>
