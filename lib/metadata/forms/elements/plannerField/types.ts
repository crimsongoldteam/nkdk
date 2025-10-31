import * as z from "zod"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPlannerField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  wrappedTimeScaleHeaderHyperlink: z.boolean().optional(),
  dimensionItemHyperlink: z.boolean().optional(),
  timeScaleItemHyperlink: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZPlannerFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  WrappedTimeScaleHeaderHyperlink: z.boolean().optional(),
  DimensionItemHyperlink: z.boolean().optional(),
  TimeScaleItemHyperlink: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TPlannerField = z.infer<typeof ZPlannerField>

export type TPlannerFieldXML = z.infer<typeof ZPlannerFieldXML>