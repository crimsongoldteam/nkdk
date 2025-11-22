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
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types";
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types";

export const ZSearchControlAddition = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  get contextMenu() {
    return ZCommandBar.optional();
  },
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedToolTip() {
    return ZFormDecoration.optional();
  },
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormItemAdditionType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  visible: z.boolean().optional(),
  get childItems(): TChildItems {
    return ZChildItems;
  },
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalStretch: z.boolean().optional(),
  maxWidth: z.number().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
});

export const ZSearchControlAdditionXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional();
  },
  AutoMaxWidth: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional();
  },
  Font: ZFontXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  TextColor: ZColorXML.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional();
  },
});

export type TSearchControlAddition = z.infer<typeof ZSearchControlAddition>;

export type TSearchControlAdditionXML = z.infer<
  typeof ZSearchControlAdditionXML
>;
