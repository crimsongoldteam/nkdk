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
import { ZTable, ZTableXML } from "../table/types";

export const ZUsualGroup = z.object({
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
  get associatedTable() {
    return ZTable.optional();
  },
  backColor: ZColor.optional(),
  behavior: SE.ZUsualGroupBehavior.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  collapsedRepresentationTitle: z.string().optional(),
  controlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  currentRowUse: SE.ZCurrentRowUse.optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  format: ZI8nText.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  groupHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  groupVerticalAlign: SE.ZItemVerticalAlign.optional(),
  hiddenRepresentationTitleBackColor: ZColor.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  representation: SE.ZUsualGroupRepresentation.optional(),
  showLeftMargin: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  throughAlign: SE.ZThroughAlign.optional(),
  titleDataPath: z.string().optional(),
  united: z.boolean().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
});

export const ZUsualGroupXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  Visible: z.boolean().optional(),
  UserVisible: ZUserVisibleXML.optional(),
  Enabled: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  EnableContentChange: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Shortcut: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  GroupHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  GroupVerticalAlign: SE.ZItemVerticalAlign.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  Behavior: SE.ZUsualGroupBehavior.optional(),
  CollapsedRepresentationTitle: z.string().optional(),
  ControlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  Representation: SE.ZUsualGroupRepresentation.optional(),
  ShowLeftMargin: z.boolean().optional(),
  United: z.boolean().optional(),
  Format: ZI8nTextXML.optional(),
  ShowTitle: z.boolean().optional(),
  TitleDataPath: z.string().optional(),
  BackColor: ZColorXML.optional(),
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional();
  },
  get AssociatedTable() {
    return ZTableXML.optional();
  },
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  HiddenRepresentationTitleBackColor: ZColorXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  ThroughAlign: SE.ZThroughAlign.optional(),
  Type: SE.ZFormGroupType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  get ChildItems() {
    return ZChildItemsXML.optional();
  },
});

export type TUsualGroup = z.infer<typeof ZUsualGroup>;

export type TUsualGroupXML = z.infer<typeof ZUsualGroupXML>;
