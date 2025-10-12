import * as z from "zod"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"

export const ZElement = z.object({
  name: z.string(),
  id: z.string(),
  type: ZElementType,
})

export type TElement = z.infer<typeof ZElement>
