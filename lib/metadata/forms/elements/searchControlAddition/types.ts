import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZSearchControlAddition = ZFormItemAddition.extend({
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalStretch: z.boolean().optional(),
  maxWidth: z.number().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZSearchControlAdditionXML = ZFormItemAdditionXML.extend({
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  TextColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TSearchControlAddition = z.infer<typeof ZSearchControlAddition>

export type TSearchControlAdditionXML = z.infer<typeof ZSearchControlAdditionXML>