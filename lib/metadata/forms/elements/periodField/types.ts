import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/forms/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPeriodField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  border: ZBorder.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZPeriodFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Border: ZBorderXML.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TPeriodField = z.infer<typeof ZPeriodField>

export type TPeriodFieldXML = z.infer<typeof ZPeriodFieldXML>