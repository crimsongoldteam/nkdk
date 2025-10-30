import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZTrackBarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  largeStep: z.number().optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  maxValue: z.number().optional(),
  minValue: z.number().optional(),
  orientation: SE.ZFormItemOrientation.optional(),
  markingAppearance: SE.ZTrackBarMarkingAppearance.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  step: z.number().optional(),
  markingStep: z.number().optional(),
  width: z.number().optional(),
})

export const ZTrackBarFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  LargeStep: z.number().optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  MaxValue: z.number().optional(),
  MinValue: z.number().optional(),
  Orientation: SE.ZFormItemOrientation.optional(),
  MarkingAppearance: SE.ZTrackBarMarkingAppearance.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  Step: z.number().optional(),
  MarkingStep: z.number().optional(),
  Width: z.number().optional(),
})

export type TTrackBarField = z.infer<typeof ZTrackBarField>

export type TTrackBarFieldXML = z.infer<typeof ZTrackBarFieldXML>