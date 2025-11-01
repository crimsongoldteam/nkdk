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
import { ZChoiceList, ZChoiceListXML } from "~/lib/metadata/commonObjects/choiceList/types"

export const ZRadioButtonField = ZFormField.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  choiceList: ZChoiceList.optional(),
  columnsCount: z.number().optional(),
  equalColumnsWidth: z.boolean().optional(),
  font: ZFont.optional(),
  itemHeight: z.number().optional(),
  itemTitleHeight: z.number().optional(),
  itemWidth: z.number().optional(),
  radioButtonType: SE.ZRadioButtonType.optional(),
  textColor: ZColor.optional(),
})

export const ZRadioButtonFieldXML = ZBaseElementXML.extend({
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  DataPath: z.string().optional(),
  Visible: z.boolean().optional(),
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
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  RadioButtonType: SE.ZRadioButtonType.optional(),
  ItemTitleHeight: z.number().optional(),
  ColumnsCount: z.number().optional(),
  Font: ZFontXML.optional(),
  TextColor: ZColorXML.optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  AutoCellHeight: z.boolean().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  CellHyperlink: z.boolean().optional(),
  ChoiceList: ZChoiceListXML.optional(),
  DefaultItem: z.boolean().optional(),
  EditMode: SE.ZColumnEditMode.optional(),
  EqualColumnsWidth: z.boolean().optional(),
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
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  ItemHeight: z.number().optional(),
  ItemWidth: z.number().optional(),
  ShowInFooter: z.boolean().optional(),
  ShowInHeader: z.boolean().optional(),
  get Table() {
    return ZTableXML.optional()
  },
  TitleBackColor: ZColorXML.optional(),
  Type: SE.ZFormFieldType.optional(),
  TypeRestriction: ZTypeDescriptionXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
})

export type TRadioButtonField = z.infer<typeof ZRadioButtonField>

export type TRadioButtonFieldXML = z.infer<typeof ZRadioButtonFieldXML>