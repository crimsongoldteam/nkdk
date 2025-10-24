import * as z from "zod"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText } from "~/lib/metadata/i8nText/types"

export const ZElement = z.object({
  type: ZElementType,
})

export const ZNamedElement = ZElement.extend({
  name: z.string(),
  id: z.string(),
})

export const ZNamedElementWithTitle = ZNamedElement.extend({
  title: ZI8nText.optional(),
})

export type TElement = z.infer<typeof ZElement>
export type TNamedElement = z.infer<typeof ZNamedElement>
export type TNamedElementWithTitle = z.infer<typeof ZNamedElementWithTitle>

export const ZNamedElementXML = z.record(
  z.string(),
  z.object({
    _id: z.string(),
    _name: z.string(),
  })
)

export type TNamedElementXML = z.infer<typeof ZNamedElementXML>
