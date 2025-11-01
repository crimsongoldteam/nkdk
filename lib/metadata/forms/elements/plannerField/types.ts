import * as z from "zod"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPlannerField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  dimensionItemHyperlink: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  timeScaleItemHyperlink: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  wrappedTimeScaleHeaderHyperlink: z.boolean().optional(),
})

export const ZPlannerFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  DimensionItemHyperlink: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  TimeScaleItemHyperlink: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
  WrappedTimeScaleHeaderHyperlink: z.boolean().optional(),
})

export type TPlannerField = z.infer<typeof ZPlannerField>

export type TPlannerFieldXML = z.infer<typeof ZPlannerFieldXML>