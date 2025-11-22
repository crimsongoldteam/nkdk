import * as z from "zod"
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
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZodChildItemsType } from "../childItems/typesExt"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZPopup = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  enableContentChange: z.boolean().optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  shortcut: z.string().optional(),
  title: ZI8nText.optional(),
  titleFont: ZFont.optional(),
  titleTextColor: ZColor.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormGroupType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalStretch: z.boolean().optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
  get childItems(): ZodChildItemsType {
    return ZChildItems
  },
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  picture: ZPicture.optional(),
  representation: SE.ZButtonRepresentation.optional(),
  shape: SE.ZButtonShape.optional(),
  shapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
})

export const ZPopupXML = z.object({
  _name: z.string(),
  _id: z.string(),
  UserVisible: ZUserVisibleXML.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  Picture: ZPictureXML.optional(),
  Representation: SE.ZButtonRepresentation.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  EnableContentChange: z.boolean().optional(),
  Enabled: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  Shape: SE.ZButtonShape.optional(),
  ShapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  Shortcut: z.string().optional(),
  TitleFont: ZFontXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormGroupType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TPopup = z.infer<typeof ZPopup>

export type TPopupXML = z.infer<typeof ZPopupXML>
