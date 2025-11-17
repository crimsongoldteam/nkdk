import { z } from "zod"
import { ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"

export const ZChoiceParameterLinkXML = z.object({
  "xr:Name": z.string(),
  "xr:DataPath": z.union([
    z.string(),
    z.object({
      "#text": z.string().optional(),
      "_xsi:type": z.string().optional(),
    }),
  ]),
  "xr:ValueChange": z.string().optional(),
})

// Схема для app:item структуры в ChoiceParameters
const ZChoiceParameterAppItemXML = z.object({
  _name: z.string(),
  "app:value": z.object({
    "_xsi:type": z.string().optional(),
    Presentation: ZI8nTextXML.optional(),
    Value: z.object({
      "_xsi:type": z.union([z.literal("xs:string"), z.literal("xs:boolean")]),
      "#text": z.union([z.string(), z.boolean()]),
    }),
  }),
})

export const ZChoiceParameterLink = z.object({
  name: z.string(),
  dataPath: z.string(),
  valueChange: z.string().optional(),
})

// Схема для ChoiceParameterLinks (xr:Link структура)
export const ZChoiceParameterLinksXML = z.union([
  z.array(
    z.object({
      "xr:Link": z.union([
        ZChoiceParameterLinkXML,
        z.array(ZChoiceParameterLinkXML),
      ]),
    })
  ),
  // Схема для ChoiceParameters (app:item структура) - может быть массивом или объектом
  z.union([
    z.object({
      "app:item": z.union([
        ZChoiceParameterAppItemXML,
        z.array(ZChoiceParameterAppItemXML),
      ]),
    }),
    z.array(
      z.object({
        "app:item": z.union([
          ZChoiceParameterAppItemXML,
          z.array(ZChoiceParameterAppItemXML),
        ]),
      })
    ),
  ]),
])

export const ZChoiceParameterLinks = z.array(ZChoiceParameterLink).optional()

export type TChoiceParameterLinkXML = z.infer<typeof ZChoiceParameterLinkXML>
export type TChoiceParameterLink = z.infer<typeof ZChoiceParameterLink>
export type TChoiceParameterLinksXML = z.infer<typeof ZChoiceParameterLinksXML>
export type TChoiceParameterLinks = z.infer<typeof ZChoiceParameterLinks>
