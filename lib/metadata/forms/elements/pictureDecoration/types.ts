import * as z from "zod"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"
import {
  ZPicture,
  ZPictureXML,
} from "~/lib/metadata/commonObjects/pictures/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZPictureDecoration = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  get contextMenu() {
    return ZCommandBar.optional()
  },
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  shortcut: z.string().optional(),
  skipOnInput: z.boolean().optional(),
  textColor: ZColor.optional(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormDecorationType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalStretch: z.boolean().optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  hyperlink: z.boolean().optional(),
  nonselectedPictureText: z.string().optional(),
  picture: ZPicture.optional(),
  pictureSize: SE.ZPictureSize.optional(),
  scale: z.number().optional(),
  zoomable: z.boolean().optional(),
  events: z
    .object({
      click: z.string().optional(),
      dragStart: z.string().optional(),
      dragEnd: z.string().optional(),
      drag: z.string().optional(),
      dragCheck: z.string().optional(),
    })
    .optional(),
})

export const ZPictureDecorationXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  Visible: z.boolean().optional(),
  UserVisible: ZUserVisibleXML.optional(),
  Enabled: z.boolean().optional(),
  Width: z.number().optional(),
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  Height: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Shortcut: z.string().optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Hyperlink: z.boolean().optional(),
  NonselectedPictureText: z.string().optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional()
  },
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  MaxHeight: z.number().optional(),
  PictureSize: SE.ZPictureSize.optional(),
  Scale: z.number().optional(),
  Type: SE.ZFormDecorationType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Zoomable: z.boolean().optional(),
  Events: ZEventsXML.optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>

export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>
