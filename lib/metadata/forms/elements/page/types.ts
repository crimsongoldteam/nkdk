import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML, TChildItems } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface Page {
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
  backColor?: Color,
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation,
  childItemsVerticalAlign?: SE.ItemVerticalAlign,
  displayImportance?: SE.DisplayImportance,
  format?: I8nText,
  group?: SE.ChildFormItemsGroup,
  horizontalSpacing?: SE.FormItemSpacing,
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant,
  picture?: Picture,
  scrollOnCompress?: boolean,
  showTitle?: boolean,
  slaveItemsWidth?: SE.ChildFormItemsWidth,
  titleDataPath?: string,
  verticalAlign?: SE.ItemVerticalAlign,
  verticalScrollOnReduceSize?: boolean,
  verticalSpacing?: SE.FormItemSpacing,
}

export interface PageXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  UserVisible: UserVisible,
  Enabled: boolean,
  ReadOnly: boolean,
  EnableContentChange: boolean,
  Title: I8nText,
  TitleTextColor: Color,
  TitleFont: Font,
  ToolTip: I8nText,
  ScrollOnCompress: boolean,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Shortcut: string,
  Width: number,
  Height: number,
  HorizontalStretch: boolean,
  VerticalStretch: boolean,
  Picture: Picture,
  Group: SE.ChildFormItemsGroup,
  HorizontalSpacing: SE.FormItemSpacing,
  VerticalSpacing: SE.FormItemSpacing,
  VerticalAlign: SE.ItemVerticalAlign,
  Format: I8nText,
  TitleDataPath: string,
  BackColor: Color,
  ExtendedTooltip: FormDecoration,
  ChildItemsHorizontalAlign: SE.ItemHorizontalLocation,
  ChildItemsVerticalAlign: SE.ItemVerticalAlign,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  ItemsAndTitlesAlign: SE.ItemsAndTitlesAlignVariant,
  ShowTitle: boolean,
  SlaveItemsWidth: SE.ChildFormItemsWidth,
  Type: SE.FormGroupType,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  VerticalScrollOnReduceSize: boolean,
  Visible: boolean,
  ChildItems: ЭлементыФормы,
}