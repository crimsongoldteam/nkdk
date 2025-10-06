import { z } from "zod"

const ZV8ItemXML = z.object({
  "v8:item": z.object({
    "v8:lang": z.string(),
    "v8:content": z.string(),
  }),
})

export const ZI8nTextXML = z.array(ZV8ItemXML)

export type TI8nTextXML = z.infer<typeof ZI8nTextXML>
