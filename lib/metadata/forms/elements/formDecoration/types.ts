import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface FormDecoration {
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
}

export interface FormDecorationXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  AutoMaxHeight: boolean,
  AutoMaxWidth: boolean,
  ContextMenu: CommandBar,
  Enabled: boolean,
  ExtendedTooltip: FormDecoration,
  Font: Font,
  Height: number,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  HorizontalStretch: boolean,
  MaxHeight: number,
  MaxWidth: number,
  Shortcut: string,
  SkipOnInput: boolean,
  TextColor: Color,
  Title: I8nText,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Type: SE.FormDecorationType,
  UserVisible: UserVisible,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  VerticalStretch: boolean,
  Visible: boolean,
  Width: number,
}