import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZViewStatusAddition = ZFormItemAddition.extend({
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  buttonsBackColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  maxWidth: z.number().optional(),
  textColor: ZColor.optional(),
  titleFont: ZFont.optional(),
  titleTextColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZViewStatusAdditionXML = ZFormItemAdditionXML.extend({
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  ButtonsBackColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  TextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  Width: z.number().optional(),
})

export type TViewStatusAddition = z.infer<typeof ZViewStatusAddition>

export type TViewStatusAdditionXML = z.infer<typeof ZViewStatusAdditionXML>