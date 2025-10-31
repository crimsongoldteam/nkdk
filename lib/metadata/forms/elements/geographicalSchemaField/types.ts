import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZGeographicalSchemaField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  output: SE.ZUseOutput.optional(),
  height: z.number().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZGeographicalSchemaFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Output: SE.ZUseOutput.optional(),
  Height: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TGeographicalSchemaField = z.infer<typeof ZGeographicalSchemaField>

export type TGeographicalSchemaFieldXML = z.infer<typeof ZGeographicalSchemaFieldXML>