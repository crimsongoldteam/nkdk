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

export const ZTrackBarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  largeStep: z.number().optional(),
  markingAppearance: SE.ZTrackBarMarkingAppearance.optional(),
  markingStep: z.number().optional(),
  maxHeight: z.number().optional(),
  maxValue: z.number().optional(),
  maxWidth: z.number().optional(),
  minValue: z.number().optional(),
  orientation: SE.ZFormItemOrientation.optional(),
  step: z.number().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z.object({
    onChange: z.string().optional(),
  }).optional(),
})

export const ZTrackBarFieldXML = z.object({
  _id: z.string(),
  _name: z.string(),
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
  HorizontalStretch: z.boolean().optional(),
  LargeStep: z.number().optional(),
  MarkingAppearance: SE.ZTrackBarMarkingAppearance.optional(),
  MarkingStep: z.number().optional(),
  MaxHeight: z.number().optional(),
  MaxValue: z.number().optional(),
  MaxWidth: z.number().optional(),
  MinValue: z.number().optional(),
  Orientation: SE.ZFormItemOrientation.optional(),
  ReadOnly: z.boolean().optional(),
  Shortcut: z.string().optional(),
  ShowInFooter: z.boolean().optional(),
  ShowInHeader: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  Step: z.number().optional(),
  get Table() {
    return ZTableXML.optional()
  },
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
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  WarningOnEdit: ZI8nTextXML.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  Width: z.number().optional(),
  Events: z.object({
    OnChange: z.string().optional(),
  }).optional(),
})

export type TTrackBarField = z.infer<typeof ZTrackBarField>

export type TTrackBarFieldXML = z.infer<typeof ZTrackBarFieldXML>