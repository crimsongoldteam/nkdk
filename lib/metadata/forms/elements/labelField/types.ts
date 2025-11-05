import * as z from "zod"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
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
  format: ZI8nText.optional(),
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
  events: z.object({
    click: z.string().optional(),
    uRLProcessing: z.string().optional(),
  }).optional(),
})

export const ZLabelFieldXML = ZFormFieldXML.extend({
  Width: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  PasswordMode: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Format: ZI8nTextXML.optional(),
  Hyperlink: z.boolean().optional(),
  MarkNegatives: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Events: z.object({
    Click: z.string().optional(),
    URLProcessing: z.string().optional(),
  }).optional(),
})

export type TLabelField = z.infer<typeof ZLabelField>

export type TLabelFieldXML = z.infer<typeof ZLabelFieldXML>