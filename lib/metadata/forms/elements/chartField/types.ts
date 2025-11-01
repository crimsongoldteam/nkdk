import * as z from "zod"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZChartField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZChartFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TChartField = z.infer<typeof ZChartField>

export type TChartFieldXML = z.infer<typeof ZChartFieldXML>