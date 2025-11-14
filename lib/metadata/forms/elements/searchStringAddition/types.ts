import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"

export const ZSearchStringAddition = z.object({
  get contextMenu() {
    return ZCommandBar.optional()
  },
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedToolTip() {
    return ZFormDecoration.optional()
  },
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormItemAdditionType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  visible: z.boolean().optional(),
  get childItems() : TChildItems {
    return ZChildItems
  },
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalStretch: z.boolean().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZSearchStringAdditionXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  Enabled: z.boolean().optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional()
  },
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional()
  },
  Font: ZFontXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TSearchStringAddition = z.infer<typeof ZSearchStringAddition>

export type TSearchStringAdditionXML = z.infer<typeof ZSearchStringAdditionXML>