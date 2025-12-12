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

export interface ButtonGroup {
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
  representation?: SE.ButtonGroupRepresentation,
}

export interface ButtonGroupXML {
  _name: z.string(),
  _id: z.string(),
  Title: I8nText,
  ToolTip: I8nText,
  ExtendedTooltip: FormDecoration,
  EnableContentChange: boolean,
  Enabled: boolean,
  Height: number,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  HorizontalStretch: boolean,
  ReadOnly: boolean,
  Representation: SE.ButtonGroupRepresentation,
  Shortcut: string,
  TitleFont: Font,
  TitleTextColor: Color,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Type: SE.FormGroupType,
  UserVisible: UserVisible,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  VerticalStretch: boolean,
  Visible: boolean,
  Width: number,
  ChildItems: ЭлементыФормы,
}