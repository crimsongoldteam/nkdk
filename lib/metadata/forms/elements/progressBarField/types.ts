import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZProgressBarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  maxValue: z.number().optional(),
  minValue: z.number().optional(),
  orientation: SE.ZFormItemOrientation.optional(),
  showPercent: z.boolean().optional(),
  representation: SE.ZProgressBarSmoothingMode.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZProgressBarFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  MaxValue: z.number().optional(),
  MinValue: z.number().optional(),
  Orientation: SE.ZFormItemOrientation.optional(),
  ShowPercent: z.boolean().optional(),
  Representation: SE.ZProgressBarSmoothingMode.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TProgressBarField = z.infer<typeof ZProgressBarField>

export type TProgressBarFieldXML = z.infer<typeof ZProgressBarFieldXML>