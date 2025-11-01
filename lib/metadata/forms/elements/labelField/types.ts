import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZLabelField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  format: z.string().optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  hyperlink: z.boolean().optional(),
  markNegatives: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  passwordMode: z.boolean().optional(),
  textColor: ZColor.optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZLabelFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Format: z.string().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  Hyperlink: z.boolean().optional(),
  MarkNegatives: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  PasswordMode: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TLabelField = z.infer<typeof ZLabelField>

export type TLabelFieldXML = z.infer<typeof ZLabelFieldXML>