import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZSearchControlAddition = ZFormItemAddition.extend({
  autoMaxWidth: z.boolean().optional(),
  maxWidth: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZSearchControlAdditionXML = ZFormItemAdditionXML.extend({
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TSearchControlAddition = z.infer<typeof ZSearchControlAddition>

export type TSearchControlAdditionXML = z.infer<typeof ZSearchControlAdditionXML>