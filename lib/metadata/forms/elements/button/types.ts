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
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  commandName: z.union([z.string(), z.number()]).optional(),
  commandUniqueness: z.boolean().optional(),
  defaultButton: z.boolean().optional(),
  defaultItem: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  locationInCommandBar: SE.ZButtonLocationInCommandBar.optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  onlyInAllActions: z.boolean().optional(),
  picture: ZPicture.optional(),
  pictureLocation: SE.ZFormButtonPictureLocation.optional(),
  representation: SE.ZButtonRepresentation.optional(),
  shape: SE.ZButtonShape.optional(),
  shapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  shortcut: z.string().optional(),
  skipOnInput: z.boolean().optional(),
  textColor: ZColor.optional(),
  title: ZI8nText.optional(),
  titleHeight: z.number().optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormButtonType.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalStretch: z.boolean().optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZButtonXML = ZBaseElementXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  CommandName: z.union([z.string(), z.number()]).optional(),
  CommandUniqueness: z.boolean().optional(),
  DefaultButton: z.boolean().optional(),
  DefaultItem: z.boolean().optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  LocationInCommandBar: SE.ZButtonLocationInCommandBar.optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  OnlyInAllActions: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  PictureLocation: SE.ZFormButtonPictureLocation.optional(),
  Representation: SE.ZButtonRepresentation.optional(),
  Shape: SE.ZButtonShape.optional(),
  ShapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  Shortcut: z.string().optional(),
  SkipOnInput: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Title: ZI8nTextXML.optional(),
  TitleHeight: z.number().optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormButtonType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TButton = z.infer<typeof ZButton>

export type TButtonXML = z.infer<typeof ZButtonXML>