import { z } from "zod"

const ZV8ItemXML = z.object({
  lang: z.string(),
  content: z.string(),
})

export const ZI8nTextXML = z.object({
  item: z.array(ZV8ItemXML),
})

export type TI8nTextXML = z.infer<typeof ZI8nTextXML>

export const ZI8nText = z.record(z.string(), z.string())

export type TI8nText = z.infer<typeof ZI8nText>
