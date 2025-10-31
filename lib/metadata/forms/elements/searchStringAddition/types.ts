import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZSearchStringAddition = ZFormItemAddition.extend({
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZSearchStringAdditionXML = ZFormItemAdditionXML.extend({
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TSearchStringAddition = z.infer<typeof ZSearchStringAddition>

export type TSearchStringAdditionXML = z.infer<typeof ZSearchStringAdditionXML>