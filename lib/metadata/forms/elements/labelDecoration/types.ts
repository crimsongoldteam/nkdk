import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface LabelDecoration {
  elementType: ElementType
  name: string
  id?: string
  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  contextMenu?: CommandBar,
  displayImportance?: SE.DisplayImportance,
  enabled?: boolean,
  extendedTooltip?: FormDecoration,
  font?: Font,
  height?: number,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  maxHeight?: number,
  maxWidth?: number,
  shortcut?: string,
  skipOnInput?: boolean,
  textColor?: Color,
  title?: I8nText,
  toolTip?: I8nText,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormDecorationType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  verticalStretch?: boolean,
  visible?: boolean,
  width?: number,
  backColor?: Color,
  border?: Border,
  borderColor?: Color,
  groupVerticalAlign?: SE.ItemVerticalAlign,
  horizontalAlign?: SE.ItemHorizontalLocation,
  hyperlink?: boolean,
  titleHeight?: number,
  verticalAlign?: SE.ItemVerticalAlign,
  events?: {
    click?: string,
    uRLProcessing?: string,
  },
}

export interface LabelDecorationXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  Visible: boolean,
  UserVisible: UserVisible,
  Enabled: boolean,
  Width: number,
  AutoMaxWidth: boolean,
  MaxWidth: number,
  Height: number,
  AutoMaxHeight: boolean,
  HorizontalStretch: boolean,
  VerticalStretch: boolean,
  SkipOnInput: boolean,
  TextColor: Color,
  Font: Font,
  Shortcut: string,
  Title: I8nText,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  GroupVerticalAlign: SE.ItemVerticalAlign,
  Hyperlink: boolean,
  HorizontalAlign: SE.ItemHorizontalLocation,
  VerticalAlign: SE.ItemVerticalAlign,
  TitleHeight: number,
  BackColor: Color,
  BorderColor: Color,
  Border: Border,
  ContextMenu: CommandBar,
  ExtendedTooltip: FormDecoration,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  MaxHeight: number,
  Type: SE.FormDecorationType,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
}