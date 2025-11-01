import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPdfDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  borderColor: ZColor.optional(),
  currentPageNumber: z.number().optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  orientation: z.number().optional(),
  output: SE.ZUseOutput.optional(),
  scale: z.number().optional(),
  usedFileName: z.string().optional(),
  verticalStretch: z.boolean().optional(),
  viewStatusLocation: SE.ZViewStatusLocation.optional(),
  width: z.number().optional(),
})

export const ZPdfDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  CurrentPageNumber: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Orientation: z.number().optional(),
  Output: SE.ZUseOutput.optional(),
  Scale: z.number().optional(),
  UsedFileName: z.string().optional(),
  VerticalStretch: z.boolean().optional(),
  ViewStatusLocation: SE.ZViewStatusLocation.optional(),
  Width: z.number().optional(),
})

export type TPdfDocumentField = z.infer<typeof ZPdfDocumentField>

export type TPdfDocumentFieldXML = z.infer<typeof ZPdfDocumentFieldXML>