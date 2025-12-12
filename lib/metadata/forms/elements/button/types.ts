import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface Button {
  elementType: ElementType
  name: string
  id?: string
  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  backColor?: Color,
  borderColor?: Color,
  commandName?: string,
  commandUniqueness?: boolean,
  dataPath?: string,
  defaultButton?: boolean,
  defaultItem?: boolean,
  displayImportance?: SE.DisplayImportance,
  enabled?: boolean,
  extendedTooltip?: FormDecoration,
  font?: Font,
  height?: number,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  locationInCommandBar?: SE.ButtonLocationInCommandBar,
  maxHeight?: number,
  maxWidth?: number,
  onlyInAllActions?: boolean,
  picture?: Picture,
  pictureLocation?: SE.FormButtonPictureLocation,
  representation?: SE.ButtonRepresentation,
  shape?: SE.ButtonShape,
  shapeRepresentation?: SE.ButtonShapeRepresentation,
  shortcut?: string,
  skipOnInput?: boolean,
  textColor?: Color,
  title?: I8nText,
  titleHeight?: number,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormButtonType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  verticalStretch?: boolean,
  visible?: boolean,
  width?: number,
}

export interface ButtonXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  Type: SE.FormButtonType,
  Visible: boolean,
  UserVisible: UserVisible,
  TitleHeight: number,
  Representation: SE.ButtonRepresentation,
  DefaultButton: boolean,
  SkipOnInput: boolean,
  Enabled: boolean,
  DefaultItem: boolean,
  Width: number,
  AutoMaxWidth: boolean,
  MaxWidth: number,
  Height: number,
  AutoMaxHeight: boolean,
  MaxHeight: number,
  HorizontalStretch: boolean,
  VerticalStretch: boolean,
  CommandName: string,
  DataPath: string,
  TextColor: Color,
  BackColor: Color,
  BorderColor: Color,
  Font: Font,
  Picture: Picture,
  Title: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Shape: SE.ButtonShape,
  ShapeRepresentation: SE.ButtonShapeRepresentation,
  PictureLocation: SE.FormButtonPictureLocation,
  LocationInCommandBar: SE.ButtonLocationInCommandBar,
  CommandUniqueness: boolean,
  ExtendedTooltip: FormDecoration,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  OnlyInAllActions: boolean,
  Shortcut: string,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
}