import z from "zod"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"

export const ZChoiceList = z.object({
  items: z.array(
    z.object({
      presentation: ZI8nText.optional(),
      checkState: z.number(),
      value: z.string(),
    })
  ),
})

const ZChoiceListItemValueXML = z.object({
  "_xsi:type": z.literal("FormChoiceListDesTimeValue"),
  Presentation: ZI8nTextXML.optional(),
  Value: z.object({
    "_xsi:type": z.union([z.literal("xs:string"), z.literal("xs:boolean")]),
    "#text": z.union([z.string(), z.boolean()]),
  }),
})

const ZChoiceListItemXML = z.object({
  "xr:Presentation": ZI8nTextXML.optional(),
  "xr:CheckState": z.number(),
  "xr:Value": ZChoiceListItemValueXML,
})

export const ZChoiceListXML = z.array(
  z.object({
    "xr:Item": ZChoiceListItemXML,
  })
)

export type TChoiceList = z.infer<typeof ZChoiceList>
export type TChoiceListXML = z.infer<typeof ZChoiceListXML>
