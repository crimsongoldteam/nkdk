import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"

export const ZPeriodField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  userVisible: ZUserVisible.optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  events: z.object({
    onChange: z.string().optional(),
    selection: z.string().optional(),
  }).optional(),
})

export const ZPeriodFieldXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  AutoCellHeight: z.boolean().optional(),
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
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
  Font: ZFontXML.optional(),
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
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  WarningOnEdit: ZI8nTextXML.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  Width: z.number().optional(),
  Events: ZEventsXML.optional(),
})

export type TPeriodField = z.infer<typeof ZPeriodField>

export type TPeriodFieldXML = z.infer<typeof ZPeriodFieldXML>