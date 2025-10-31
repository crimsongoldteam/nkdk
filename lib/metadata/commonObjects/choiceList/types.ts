import z from "zod"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"

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
    "_xsi:type": z.literal("xs:string"),
    "#text": z.string(),
  }),
})

const ZChoiceListItemXML = z.object({
  "xr:Presentation": ZI8nTextXML.optional(),
  "xr:CheckState": z.number(),
  "xr:Value": ZChoiceListItemValueXML,
})

export const ZChoiceListXML = z.object({
  "xr:Item": z.array(ZChoiceListItemXML),
})

export type TChoiceList = z.infer<typeof ZChoiceList>
export type TChoiceListXML = z.infer<typeof ZChoiceListXML>
