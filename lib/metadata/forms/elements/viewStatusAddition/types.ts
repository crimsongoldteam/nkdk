import * as SE from "~/lib/metadata/systemEnumerations/types"
import { I8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { Color } from "~/lib/metadata/commonObjects/color/types"
import { FormDecoration } from "../formDecoration/types"
import { CommandBar } from "../commandBar/types"
import { UserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { ElementType } from "~/lib/metadata/forms/elements/types"

export interface ViewStatusAddition {
  elementType: ElementType
  name: string
  id?: string
  contextMenu?: CommandBar,
  displayImportance?: SE.DisplayImportance,
  enabled?: boolean,
  extendedToolTip?: FormDecoration,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  title?: I8nText,
  toolTip?: I8nText,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormItemAdditionType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  visible?: boolean,
  childItems?: ЭлементыФормы,
  autoMaxWidth?: boolean,
  backColor?: Color,
  border?: Border,
  borderColor?: Color,
  buttonsBackColor?: Color,
  font?: Font,
  horizontalAlign?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  maxWidth?: number,
  textColor?: Color,
  titleFont?: Font,
  titleTextColor?: Color,
  width?: number,
}

export interface ViewStatusAdditionXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  ContextMenu: CommandBar,
  AutoMaxWidth: boolean,
  BackColor: Color,
  Border: Border,
  BorderColor: Color,
  ButtonsBackColor: Color,
  Enabled: boolean,
  ExtendedToolTip: FormDecoration,
  Font: Font,
  HorizontalAlign: SE.ItemHorizontalLocation,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  HorizontalStretch: boolean,
  MaxWidth: number,
  TextColor: Color,
  Title: I8nText,
  TitleFont: Font,
  TitleTextColor: Color,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Type: SE.FormItemAdditionType,
  UserVisible: UserVisible,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  Visible: boolean,
  Width: number,
  ChildItems: ЭлементыФормы,
}