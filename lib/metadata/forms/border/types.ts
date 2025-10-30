import * as SE from "~/lib/metadata/systemEnumerations/types"
import z from "zod"

export const ZBorder = z.object({
  ref: z.string().optional(),
  width: z.number().optional(),
  controlBorderType: SE.ZControlBorderType.optional(),
})

export const ZBorderXML = z.object({
  _ref: z.string().optional(),
  _width: z.coerce.number().optional(),
  "v8ui:style": z
    .union([
      z.string(),
      z.object({
        "#text": z.string().optional(),
        "_xsi:type": z.string().optional(),
      }),
    ])
    .optional(),
})

export type TBorder = z.infer<typeof ZBorder>
export type TBorderXML = z.infer<typeof ZBorderXML>
