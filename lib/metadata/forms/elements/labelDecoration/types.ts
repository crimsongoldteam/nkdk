import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZLabelDecoration = ZFormDecoration.extend({
  backColor: ZColor.optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  hyperlink: z.boolean().optional(),
  titleHeight: z.number().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
})

export const ZLabelDecorationXML = ZBaseElementXML.extend({
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Visible: z.boolean().optional(),
  Enabled: z.boolean().optional(),
  Width: z.number().optional(),
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  Height: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Shortcut: z.string().optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Hyperlink: z.boolean().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  TitleHeight: z.number().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Border: ZBorderXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  MaxHeight: z.number().optional(),
  Type: SE.ZFormDecorationType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
})

export type TLabelDecoration = z.infer<typeof ZLabelDecoration>

export type TLabelDecorationXML = z.infer<typeof ZLabelDecorationXML>