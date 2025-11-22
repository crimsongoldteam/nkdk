import * as z from "zod";
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types";
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types";
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types";
import {
  ZPicture,
  ZPictureXML,
} from "~/lib/metadata/commonObjects/pictures/types";
import {
  ZTypeDescription,
  ZTypeDescriptionXML,
} from "~/lib/metadata/commonObjects/typeDescription/types";
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types";
import { ZElementType } from "~/lib/metadata/forms/elements/types";
import { ZEventsXML } from "~/lib/metadata/forms/events/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types";
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types";
import { ZTable, ZTableXML } from "../table/types";

export const ZGanttChartField = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  autoCellHeight: z.boolean().optional(),
  cellHyperlink: z.boolean().optional(),
  get contextMenu() {
    return ZCommandBar.optional();
  },
  dataPath: z.string().optional(),
  defaultItem: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  editMode: SE.ZColumnEditMode.optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional();
  },
  fixingInTable: SE.ZFixingInTable.optional(),
  footerBackColor: ZColor.optional(),
  footerDataPath: z.string().optional(),
  footerFont: ZFont.optional(),
  footerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  footerPicture: ZPicture.optional(),
  footerText: ZI8nText.optional(),
  footerTextColor: ZColor.optional(),
  headerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  headerPicture: ZPicture.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  readOnly: z.boolean().optional(),
  shortcut: z.string().optional(),
  showInFooter: z.boolean().optional(),
  showInHeader: z.boolean().optional(),
  skipOnInput: z.boolean().optional(),
  get table() {
    return ZTable.optional();
  },
  title: ZI8nText.optional(),
  titleBackColor: ZColor.optional(),
  titleFont: ZFont.optional(),
  titleHeight: z.number().optional(),
  titleLocation: SE.ZFormItemTitleLocation.optional(),
  titleTextColor: ZColor.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormFieldType.optional(),
  typeRestriction: ZTypeDescription.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  visible: z.boolean().optional(),
  warningOnEdit: ZI8nText.optional(),
  warningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  horizontalLines: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  intervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  tableLocation: SE.ZGanttChartTableLocation.optional(),
  valuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  verticalLines: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z
    .object({
      onChange: z.string().optional(),
      selection: z.string().optional(),
      detailProcessing: z.string().optional(),
      beforeExpand: z.string().optional(),
      beforeCollapse: z.string().optional(),
      onActivateValue: z.string().optional(),
      onActivateInterval: z.string().optional(),
      onIntervalEditEnd: z.string().optional(),
    })
    .optional(),
});

export const ZGanttChartFieldXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  AutoCellHeight: z.boolean().optional(),
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  CellHyperlink: z.boolean().optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional();
  },
  DataPath: z.string().optional(),
  DefaultItem: z.boolean().optional(),
  EditMode: SE.ZColumnEditMode.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional();
  },
  FixingInTable: SE.ZFixingInTable.optional(),
  FooterBackColor: ZColorXML.optional(),
  FooterDataPath: z.string().optional(),
  FooterFont: ZFontXML.optional(),
  FooterHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  FooterPicture: ZPictureXML.optional(),
  FooterText: ZI8nTextXML.optional(),
  FooterTextColor: ZColorXML.optional(),
  HeaderHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HeaderPicture: ZPictureXML.optional(),
  Height: z.number().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalLines: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  IntervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  ReadOnly: z.boolean().optional(),
  Shortcut: z.string().optional(),
  ShowInFooter: z.boolean().optional(),
  ShowInHeader: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  get Table() {
    return ZTableXML.optional();
  },
  TableLocation: SE.ZGanttChartTableLocation.optional(),
  Title: ZI8nTextXML.optional(),
  TitleBackColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  TitleHeight: z.number().optional(),
  TitleLocation: SE.ZFormItemTitleLocation.optional(),
  TitleTextColor: ZColorXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormFieldType.optional(),
  TypeRestriction: ZTypeDescriptionXML.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  ValuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalLines: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  WarningOnEdit: ZI8nTextXML.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  Width: z.number().optional(),
  Events: ZEventsXML.optional(),
});

export type TGanttChartField = z.infer<typeof ZGanttChartField>;

export type TGanttChartFieldXML = z.infer<typeof ZGanttChartFieldXML>;
