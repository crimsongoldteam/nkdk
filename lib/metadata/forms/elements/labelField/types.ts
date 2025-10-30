import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/forms/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZLabelField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  markNegatives: z.boolean().optional(),
  height: z.number().optional(),
  hyperlink: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  border: ZBorder.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  passwordMode: z.boolean().optional(),
  format: z.string().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZLabelFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  MarkNegatives: z.boolean().optional(),
  Height: z.number().optional(),
  Hyperlink: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Border: ZBorderXML.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  PasswordMode: z.boolean().optional(),
  Format: z.string().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TLabelField = z.infer<typeof ZLabelField>

export type TLabelFieldXML = z.infer<typeof ZLabelFieldXML>