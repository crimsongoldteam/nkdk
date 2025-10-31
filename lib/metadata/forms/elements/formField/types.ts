import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormTable, ZFormTableXML } from "../formTable/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZFormField = ZBaseElement.extend({
  autoCellHeight: z.boolean().optional(),
  defaultItem: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  type: SE.ZFormFieldType.optional(),
  visible: z.boolean().optional(),
  titleHeight: z.number().optional(),
  cellHyperlink: z.boolean().optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  footerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  headerHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  footerPicture: ZPicture.optional(),
  headerPicture: ZPicture.optional(),
  get contextMenu() {
    return ZFormGroup.optional()
  },
  typeRestriction: ZTypeDescription.optional(),
  showInFooter: z.boolean().optional(),
  showInHeader: z.boolean().optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  warningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  toolTip: ZI8nText.optional(),
  titleLocation: SE.ZFormItemTitleLocation.optional(),
  warningOnEdit: z.string().optional(),
  skipOnInput: z.boolean().optional(),
  dataPath: z.string().optional(),
  footerDataPath: z.string().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  editMode: SE.ZColumnEditMode.optional(),
  shortcut: z.string().optional(),
  get table() {
    return ZFormTable.optional()
  },
  footerText: ZI8nText.optional(),
  readOnly: z.boolean().optional(),
  fixingInTable: SE.ZFixingInTable.optional(),
  titleTextColor: ZColor.optional(),
  footerTextColor: ZColor.optional(),
  titleBackColor: ZColor.optional(),
  footerBackColor: ZColor.optional(),
  titleFont: ZFont.optional(),
  footerFont: ZFont.optional(),
})

export const ZFormFieldXML = ZBaseElementXML.extend({
  AutoCellHeight: z.boolean().optional(),
  DefaultItem: z.boolean().optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Type: SE.ZFormFieldType.optional(),
  Visible: z.boolean().optional(),
  TitleHeight: z.number().optional(),
  CellHyperlink: z.boolean().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  FooterHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HeaderHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  FooterPicture: ZPictureXML.optional(),
  HeaderPicture: ZPictureXML.optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  TypeRestriction: ZTypeDescriptionXML.optional(),
  ShowInFooter: z.boolean().optional(),
  ShowInHeader: z.boolean().optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  WarningOnEditRepresentation: SE.ZWarningOnEditRepresentation.optional(),
  ToolTip: ZI8nTextXML.optional(),
  TitleLocation: SE.ZFormItemTitleLocation.optional(),
  WarningOnEdit: z.string().optional(),
  SkipOnInput: z.boolean().optional(),
  DataPath: z.string().optional(),
  FooterDataPath: z.string().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  EditMode: SE.ZColumnEditMode.optional(),
  Shortcut: z.string().optional(),
  get Table() {
    return ZFormTableXML.optional()
  },
  FooterText: ZI8nTextXML.optional(),
  ReadOnly: z.boolean().optional(),
  FixingInTable: SE.ZFixingInTable.optional(),
  TitleTextColor: ZColorXML.optional(),
  FooterTextColor: ZColorXML.optional(),
  TitleBackColor: ZColorXML.optional(),
  FooterBackColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  FooterFont: ZFontXML.optional(),
})

export type TFormField = z.infer<typeof ZFormField>

export type TFormFieldXML = z.infer<typeof ZFormFieldXML>