import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZHTMLDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  borderColor: ZColor.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  output: SE.ZUseOutput.optional(),
  userAgentInformation: z.string().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z.object({
    documentComplete: z.string().optional(),
    beforeWrite: z.string().optional(),
    beforePrint: z.string().optional(),
    afterWrite: z.string().optional(),
    onClick: z.string().optional(),
  }).optional(),
})

export const ZHTMLDocumentFieldXML = ZFormFieldXML.extend({
  Width: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Output: SE.ZUseOutput.optional(),
  UserAgentInformation: z.string().optional(),
  VerticalStretch: z.boolean().optional(),
  Events: z.object({
    DocumentComplete: z.string().optional(),
    BeforeWrite: z.string().optional(),
    BeforePrint: z.string().optional(),
    AfterWrite: z.string().optional(),
    OnClick: z.string().optional(),
  }).optional(),
})

export type THTMLDocumentField = z.infer<typeof ZHTMLDocumentField>

export type THTMLDocumentFieldXML = z.infer<typeof ZHTMLDocumentFieldXML>