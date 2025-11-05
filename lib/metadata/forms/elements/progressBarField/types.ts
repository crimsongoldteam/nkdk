import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZProgressBarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  borderColor: ZColor.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxValue: z.number().optional(),
  maxWidth: z.number().optional(),
  minValue: z.number().optional(),
  orientation: SE.ZFormItemOrientation.optional(),
  representation: SE.ZProgressBarSmoothingMode.optional(),
  showPercent: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZProgressBarFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxValue: z.number().optional(),
  MaxWidth: z.number().optional(),
  MinValue: z.number().optional(),
  Orientation: SE.ZFormItemOrientation.optional(),
  Representation: SE.ZProgressBarSmoothingMode.optional(),
  ShowPercent: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TProgressBarField = z.infer<typeof ZProgressBarField>

export type TProgressBarFieldXML = z.infer<typeof ZProgressBarFieldXML>