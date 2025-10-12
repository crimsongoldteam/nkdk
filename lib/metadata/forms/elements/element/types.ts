import * as z from "zod"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"

export const ZElement = z.object({
  type: ZElementType,
})

export const ZNamedElement = ZElement.extend({
  name: z.string(),
  id: z.string(),
})

export type TElement = z.infer<typeof ZElement>
export type TNamedElement = z.infer<typeof ZNamedElement>
