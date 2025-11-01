import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZGanttChartField = ZFormField.extend({
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
})

export const ZGanttChartFieldXML = ZBaseElementXML.extend({
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  AutoCellHeight: z.boolean().optional(),
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  CellHyperlink: z.boolean().optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  DataPath: z.string().optional(),
  DefaultItem: z.boolean().optional(),
  EditMode: SE.ZColumnEditMode.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
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
    return ZTableXML.optional()
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
  ValuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalLines: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  WarningOnEdit: ZI8nTextXML.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  Width: z.number().optional(),
})

export type TGanttChartField = z.infer<typeof ZGanttChartField>

export type TGanttChartFieldXML = z.infer<typeof ZGanttChartFieldXML>