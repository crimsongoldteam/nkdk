import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZTextDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  output: SE.ZUseOutput.optional(),
  selectedText: z.string().optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZTextDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Output: SE.ZUseOutput.optional(),
  SelectedText: z.string().optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TTextDocumentField = z.infer<typeof ZTextDocumentField>

export type TTextDocumentFieldXML = z.infer<typeof ZTextDocumentFieldXML>