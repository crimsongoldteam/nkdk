import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPdfDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  output: SE.ZUseOutput.optional(),
  height: z.number().optional(),
  usedFileName: z.string().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  scale: z.number().optional(),
  currentPageNumber: z.number().optional(),
  orientation: z.number().optional(),
  viewStatusLocation: ERROR: No type found for property ПоложениеСостоянияПросмотра,
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZPdfDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Output: SE.ZUseOutput.optional(),
  Height: z.number().optional(),
  UsedFileName: z.string().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Scale: z.number().optional(),
  CurrentPageNumber: z.number().optional(),
  Orientation: z.number().optional(),
  ViewStatusLocation: ERROR: No type found for property ПоложениеСостоянияПросмотра,
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TPdfDocumentField = z.infer<typeof ZPdfDocumentField>

export type TPdfDocumentFieldXML = z.infer<typeof ZPdfDocumentFieldXML>