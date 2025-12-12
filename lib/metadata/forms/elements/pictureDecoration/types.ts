import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface PictureDecoration {
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
  border?: Border,
  borderColor?: Color,
  enableDrag?: boolean,
  enableStartDrag?: boolean,
  fileDragMode?: SE.FileDragMode,
  hyperlink?: boolean,
  nonselectedPictureText?: string,
  picture?: Picture,
  pictureSize?: SE.PictureSize,
  scale?: number,
  zoomable?: boolean,
  events?: {
    click?: string,
    dragStart?: string,
    dragEnd?: string,
    drag?: string,
    dragCheck?: string,
  },
}

export interface PictureDecorationXML {
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
  Hyperlink: boolean,
  NonselectedPictureText: string,
  EnableStartDrag: boolean,
  EnableDrag: boolean,
  Picture: Picture,
  FileDragMode: SE.FileDragMode,
  ContextMenu: CommandBar,
  ExtendedTooltip: FormDecoration,
  Border: Border,
  BorderColor: Color,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  MaxHeight: number,
  PictureSize: SE.PictureSize,
  Scale: number,
  Type: SE.FormDecorationType,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  Zoomable: boolean,
}