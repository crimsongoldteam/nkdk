import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"

export const ZButtonGroup = ZFormGroup.extend({
  representation: SE.ZButtonGroupRepresentation.optional(),
  userVisible: ZUserVisible.optional(),
})

export const ZButtonGroupXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  EnableContentChange: z.boolean().optional(),
  Enabled: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  Representation: SE.ZButtonGroupRepresentation.optional(),
  Shortcut: z.string().optional(),
  TitleFont: ZFontXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormGroupType.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TButtonGroup = z.infer<typeof ZButtonGroup>

export type TButtonGroupXML = z.infer<typeof ZButtonGroupXML>