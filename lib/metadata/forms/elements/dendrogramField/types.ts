import * as z from "zod"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZDendrogramField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZDendrogramFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TDendrogramField = z.infer<typeof ZDendrogramField>

export type TDendrogramFieldXML = z.infer<typeof ZDendrogramFieldXML>