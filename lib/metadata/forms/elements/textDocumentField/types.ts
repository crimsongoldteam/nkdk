import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZTextDocumentField = ZFormField.extend({
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

export const ZTextDocumentFieldXML = ZFormFieldXML.extend({
  Width: z.number().optional(),
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  BorderColor: ZColorXML.optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  Output: SE.ZUseOutput.optional(),
  SelectedText: z.string().optional(),
  Events: z.object({
    BeforeWrite: z.string().optional(),
    BeforePrint: z.string().optional(),
    AfterWrite: z.string().optional(),
  }).optional(),
})

export type TTextDocumentField = z.infer<typeof ZTextDocumentField>

export type TTextDocumentFieldXML = z.infer<typeof ZTextDocumentFieldXML>