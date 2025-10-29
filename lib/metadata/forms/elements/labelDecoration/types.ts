import * as z from "zod"
import { ZNamedElement } from "../baseElement/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"

export const ZLabelDecorationXML = z.object({
  LabelDecoration: z.object({
    _id: z.string(),
    _name: z.string(),
    Title: ZI8nTextXML.optional(),
  }),
})

export const ZLabelDecoration = ZNamedElement.extend({
  title: ZI8nText.optional(),
})

export type TLabelDecoration = z.infer<typeof ZLabelDecoration>
export type TLabelDecorationXML = z.infer<typeof ZLabelDecorationXML>
