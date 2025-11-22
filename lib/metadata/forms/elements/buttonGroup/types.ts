import * as z from "zod";
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types";
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types";
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types";
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types";
import { ZElementType } from "~/lib/metadata/forms/elements/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { TChildItems, ZChildItems, ZChildItemsXML } from "../childItems/types";
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types";

export const ZButtonGroup = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  enableContentChange: z.boolean().optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional();
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
    return ZChildItems;
  },
  representation: SE.ZButtonGroupRepresentation.optional(),
});

export const ZButtonGroupXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional();
  },
  EnableContentChange: z.boolean().optional(),
  Enabled: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  Representation: SE.ZButtonGroupRepresentation.optional(),
  Shortcut: z.string().optional(),
  TitleFont: ZFontXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormGroupType.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional();
  },
});

export type TButtonGroup = z.infer<typeof ZButtonGroup>;

export type TButtonGroupXML = z.infer<typeof ZButtonGroupXML>;
