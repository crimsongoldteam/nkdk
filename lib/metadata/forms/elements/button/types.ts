import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZButton = ZBaseElement.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  defaultItem: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  type: SE.ZFormButtonType.optional(),
  visible: z.boolean().optional(),
  height: z.number().optional(),
  titleHeight: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  commandName: z.string().optional(),
  picture: ZPicture.optional(),
  defaultButton: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  representation: SE.ZButtonRepresentation.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  shapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  locationInCommandBar: SE.ZButtonLocationInCommandBar.optional(),
  pictureLocation: SE.ZFormButtonPictureLocation.optional(),
  skipOnInput: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  shortcut: z.string().optional(),
  onlyInAllActions: z.boolean().optional(),
  commandUniqueness: z.boolean().optional(),
  shape: SE.ZButtonShape.optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  backColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZButtonXML = ZBaseElementXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  DefaultItem: z.boolean().optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Type: SE.ZFormButtonType.optional(),
  Visible: z.boolean().optional(),
  Height: z.number().optional(),
  TitleHeight: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  CommandName: z.string().optional(),
  Picture: ZPictureXML.optional(),
  DefaultButton: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Representation: SE.ZButtonRepresentation.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  ShapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  LocationInCommandBar: SE.ZButtonLocationInCommandBar.optional(),
  PictureLocation: SE.ZFormButtonPictureLocation.optional(),
  SkipOnInput: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Shortcut: z.string().optional(),
  OnlyInAllActions: z.boolean().optional(),
  CommandUniqueness: z.boolean().optional(),
  Shape: SE.ZButtonShape.optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TButton = z.infer<typeof ZButton>

export type TButtonXML = z.infer<typeof ZButtonXML>