import { z } from "zod"

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

export const ZChoiceParameterLink = z.object({
  name: z.string(),
  dataPath: z.string(),
  valueChange: z.string().optional(),
})

export const ZChoiceParameterLinksXML = z.object({
  "xr:Link": z.union([ZChoiceParameterLinkXML, z.array(ZChoiceParameterLinkXML)]).optional(),
})

export const ZChoiceParameterLinks = z.array(ZChoiceParameterLink).optional()

export type TChoiceParameterLinkXML = z.infer<typeof ZChoiceParameterLinkXML>
export type TChoiceParameterLink = z.infer<typeof ZChoiceParameterLink>
export type TChoiceParameterLinksXML = z.infer<typeof ZChoiceParameterLinksXML>
export type TChoiceParameterLinks = z.infer<typeof ZChoiceParameterLinks>
