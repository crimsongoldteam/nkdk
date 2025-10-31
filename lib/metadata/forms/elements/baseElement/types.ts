import * as z from "zod"
import { ZElementType } from "../types"
import { ZI8nText } from "~/lib/metadata/i8nText/types"

export const ZBaseElement = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string(),
})

// export const ZNamedElement = ZElement.extend({
//   name: z.string(),
//   id: z.string(),
// })

export const ZNamedElementWithTitle = ZBaseElement.extend({
  title: ZI8nText.optional(),
})

export type TBaseElement = z.infer<typeof ZBaseElement>
// export type TNamedElement = z.infer<typeof ZNamedElement>
export type TNamedElementWithTitle = z.infer<typeof ZNamedElementWithTitle>

export const ZBaseElementXML = z.object({
  _id: z.string(),
  _name: z.string(),
})

export type TBaseElementXML = z.infer<typeof ZBaseElementXML>
