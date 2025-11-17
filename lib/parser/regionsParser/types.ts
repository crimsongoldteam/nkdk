import z from "zod"

const ZToken = z.object({
  image: z.string(),
})
const ZCSTRegionHeader = z.object({
  name: z.literal("header"),
  children: z.object({
    Dashes: z.array(ZToken),
    Text: z.array(ZToken),
  }),
})
const ZCSTText = z.object({
  name: z.literal("text"),
  children: z.object({
    Text: z.array(ZToken).optional(),
  }),
})
const ZCSTLine = z.object({
  name: z.literal("line"),
  children: z.object({
    header: z.array(ZCSTRegionHeader).optional(),
    text: z.array(ZCSTText).optional(),
  }),
})

export const ZCSTRegions = z.array(ZCSTLine)

export type ICSTRegions = z.infer<typeof ZCSTRegions>

export type ICSTLine = z.infer<typeof ZCSTLine>
export type ICSTRegionHeader = z.infer<typeof ZCSTRegionHeader>

const ZRegion = z.object({ title: z.string(), content: z.string() })

export type ISection = z.infer<typeof ZRegion>
