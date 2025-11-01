import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZSearchStringAddition = ZFormItemAddition.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalStretch: z.boolean().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZSearchStringAdditionXML = ZFormItemAdditionXML.extend({
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  HorizontalStretch: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TSearchStringAddition = z.infer<typeof ZSearchStringAddition>

export type TSearchStringAdditionXML = z.infer<typeof ZSearchStringAdditionXML>