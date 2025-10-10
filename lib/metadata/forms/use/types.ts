import { z } from "zod"

export const ZUseXML = z.object({
  Common: z.boolean(),
  Value: z.array(
    z.object({
      _name: z.string(),
      value: z.boolean(),
    })
  ),
})

export const ZUse = z.object({
  common: z.boolean(),
  values: z.array(
    z.object({
      name: z.string(),
      value: z.boolean(),
    })
  ),
})

export type TUseXML = z.infer<typeof ZUseXML>
export type TUse = z.infer<typeof ZUse>
