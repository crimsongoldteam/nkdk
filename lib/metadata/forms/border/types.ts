import * as SE from "~/lib/metadata/systemEnumerations/types"
import z from "zod"

export const ZBorder = z.object({
  ref: z.string().optional(),
  width: z.number().optional(),
  controlBorderType: SE.ZControlBorderType.optional(),
})
