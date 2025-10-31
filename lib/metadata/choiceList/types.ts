import z from "zod"

export const ZChoiceList = z.object({
  items: z.array(
    z.object({
      presentation: z.string(),
      checkState: z.number(),
      value: z.string(),
    })
  ),
})

export const ZChoiceListXML = z.object({
  items: z.array(
    z.object({
      presentation: z.string(),
      checkState: z.number(),
      value: z.string(),
    })
  ),
})

export type TChoiceList = z.infer<typeof ZChoiceList>
export type TChoiceListXML = z.infer<typeof ZChoiceListXML>
