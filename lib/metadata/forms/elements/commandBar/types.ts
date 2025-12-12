import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML, TChildItems } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface CommandBar {
  elementType: ElementType
  name: string
  id?: string
  enableContentChange?: boolean,
  enabled?: boolean,
  extendedTooltip?: FormDecoration,
  height?: number,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  readOnly?: boolean,
  shortcut?: string,
  title?: I8nText,
  titleFont?: Font,
  titleTextColor?: Color,
  toolTip?: I8nText,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormGroupType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  verticalStretch?: boolean,
  visible?: boolean,
  width?: number,
  childItems?: ЭлементыФормы,
  autofill?: boolean,
  displayImportance?: SE.DisplayImportance,
  horizontalAlign?: SE.ItemHorizontalLocation,
}

export interface CommandBarXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  HorizontalAlign: SE.ItemHorizontalLocation,
  Visible: boolean,
  UserVisible: UserVisible,
  Enabled: boolean,
  ReadOnly: boolean,
  EnableContentChange: boolean,
  Title: I8nText,
  TitleTextColor: Color,
  TitleFont: Font,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Width: number,
  Height: number,
  HorizontalStretch: boolean,
  VerticalStretch: boolean,
  ExtendedTooltip: FormDecoration,
  Autofill: boolean,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  Shortcut: string,
  Type: SE.FormGroupType,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  ChildItems: ЭлементыФормы,
}