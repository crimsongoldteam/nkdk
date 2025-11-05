import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPeriodField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z.object({
    selection: z.string().optional(),
  }).optional(),
})

export const ZPeriodFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
  Events: z.object({
    Selection: z.string().optional(),
  }).optional(),
})

export type TPeriodField = z.infer<typeof ZPeriodField>

export type TPeriodFieldXML = z.infer<typeof ZPeriodFieldXML>