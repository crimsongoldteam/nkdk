import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import {
  ZPicture,
  ZPictureXML,
} from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML, TChildItems } from "../childItems/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"

export const ZPage = z.object({
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
  get childItems(): TChildItems {
    return ZChildItems
  },
  backColor: ZColor.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  format: ZI8nText.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  picture: ZPicture.optional(),
  scrollOnCompress: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  titleDataPath: z.string().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalScrollOnReduceSize: z.boolean().optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
})

export const ZPageXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  Enabled: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  EnableContentChange: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ScrollOnCompress: z.boolean().optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Shortcut: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  Format: ZI8nTextXML.optional(),
  TitleDataPath: z.string().optional(),
  BackColor: ZColorXML.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  ShowTitle: z.boolean().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  Type: SE.ZFormGroupType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalScrollOnReduceSize: z.boolean().optional(),
  Visible: z.boolean().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TPage = z.infer<typeof ZPage>

export type TPageXML = z.infer<typeof ZPageXML>
