import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZFormattedDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  output: SE.ZUseOutput.optional(),
  selectedText: z.string().optional(),
  textColor: ZColor.optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z.object({
    beforeWrite: z.string().optional(),
    beforePrint: z.string().optional(),
    afterWrite: z.string().optional(),
  }).optional(),
})

export const ZFormattedDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Output: SE.ZUseOutput.optional(),
  SelectedText: z.string().optional(),
  TextColor: ZColorXML.optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
  Events: z.object({
    BeforeWrite: z.string().optional(),
    BeforePrint: z.string().optional(),
    AfterWrite: z.string().optional(),
  }).optional(),
})

export type TFormattedDocumentField = z.infer<typeof ZFormattedDocumentField>

export type TFormattedDocumentFieldXML = z.infer<typeof ZFormattedDocumentFieldXML>