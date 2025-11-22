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

export const ZSpreadSheetDocumentField = z.object({
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
  blackAndWhiteView: z.boolean().optional(),
  borderColor: ZColor.optional(),
  drawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  edit: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  height: z.number().optional(),
  horizontalScrollBar: SE.ZScrollBarUse.optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  output: SE.ZUseOutput.optional(),
  pointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  protection: z.boolean().optional(),
  selectionShowMode: SE.ZSelectionShowMode.optional(),
  showCellNames: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  showGroups: z.boolean().optional(),
  showHeaders: z.boolean().optional(),
  showRowAndColumnNames: z.boolean().optional(),
  statePresentation: SE.ZStatePresentation.optional(),
  usedFileName: z.string().optional(),
  verticalScrollBar: SE.ZScrollBarUse.optional(),
  verticalStretch: z.boolean().optional(),
  viewScalingMode: SE.ZViewScalingMode.optional(),
  width: z.number().optional(),
  events: z
    .object({
      onChange: z.string().optional(),
      selection: z.string().optional(),
      dragStart: z.string().optional(),
      additionalDetailProcessing: z.string().optional(),
      uRLProcessing: z.string().optional(),
      detailProcessing: z.string().optional(),
      dragEnd: z.string().optional(),
      beforeWrite: z.string().optional(),
      beforePrint: z.string().optional(),
      drag: z.string().optional(),
      afterWrite: z.string().optional(),
      onActivate: z.string().optional(),
      onChangeAreaContentEvent: z.string().optional(),
      dragCheck: z.string().optional(),
    })
    .optional(),
});

export const ZSpreadSheetDocumentFieldXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  DataPath: z.string().optional(),
  Visible: z.boolean().optional(),
  UserVisible: ZUserVisibleXML.optional(),
  Enabled: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  TitleLocation: SE.ZFormItemTitleLocation.optional(),
  TitleHeight: z.number().optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  WarningOnEdit: ZI8nTextXML.optional(),
  Shortcut: z.string().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  ShowGrid: z.boolean().optional(),
  ShowHeaders: z.boolean().optional(),
  BlackAndWhiteView: z.boolean().optional(),
  Protection: z.boolean().optional(),
  DrawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  PointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  Output: SE.ZUseOutput.optional(),
  Edit: z.boolean().optional(),
  ShowGroups: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  ShowCellNames: z.boolean().optional(),
  ShowRowAndColumnNames: z.boolean().optional(),
  ViewScalingMode: SE.ZViewScalingMode.optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional();
  },
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional();
  },
  AutoCellHeight: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  CellHyperlink: z.boolean().optional(),
  DefaultItem: z.boolean().optional(),
  EditMode: SE.ZColumnEditMode.optional(),
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
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalScrollBar: SE.ZScrollBarUse.optional(),
  MaxHeight: z.number().optional(),
  SelectionShowMode: SE.ZSelectionShowMode.optional(),
  ShowInFooter: z.boolean().optional(),
  ShowInHeader: z.boolean().optional(),
  StatePresentation: SE.ZStatePresentation.optional(),
  get Table() {
    return ZTableXML.optional();
  },
  TitleBackColor: ZColorXML.optional(),
  Type: SE.ZFormFieldType.optional(),
  TypeRestriction: ZTypeDescriptionXML.optional(),
  UsedFileName: z.string().optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalScrollBar: SE.ZScrollBarUse.optional(),
  Width: z.number().optional(),
  Events: ZEventsXML.optional(),
});

export type TSpreadSheetDocumentField = z.infer<
  typeof ZSpreadSheetDocumentField
>;

export type TSpreadSheetDocumentFieldXML = z.infer<
  typeof ZSpreadSheetDocumentFieldXML
>;
