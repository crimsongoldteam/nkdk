import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZViewStatusAddition = ZFormItemAddition.extend({
  autoMaxWidth: z.boolean().optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  maxWidth: z.number().optional(),
  border: ZBorder.optional(),
  horizontalStretch: z.boolean().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  titleTextColor: ZColor.optional(),
  backColor: ZColor.optional(),
  buttonsBackColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
  titleFont: ZFont.optional(),
})

export const ZViewStatusAdditionXML = ZFormItemAdditionXML.extend({
  AutoMaxWidth: z.boolean().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  MaxWidth: z.number().optional(),
  Border: ZBorderXML.optional(),
  HorizontalStretch: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  ButtonsBackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
  TitleFont: ZFontXML.optional(),
})

export type TViewStatusAddition = z.infer<typeof ZViewStatusAddition>

export type TViewStatusAdditionXML = z.infer<typeof ZViewStatusAdditionXML>