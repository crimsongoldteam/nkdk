import z from "zod"

const ZToken = z.object({
  image: z.string(),
})
const ZCSTSectionHeader = z.object({
  name: z.literal("sectionHeader"),
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
  children: z.object({ sectionHeader: z.array(ZCSTSectionHeader).optional(), text: z.array(ZCSTText).optional() }),
})

export const ZCSTSections = z.array(ZCSTLine)

export type ICSTSections = z.infer<typeof ZCSTSections>

export type ICSTLine = z.infer<typeof ZCSTLine>
export type ICSTSectionHeader = z.infer<typeof ZCSTSectionHeader>

const ZSection = z.object({ title: z.string(), content: z.string() })

export type ISection = z.infer<typeof ZSection>
