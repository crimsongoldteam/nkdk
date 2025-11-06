import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TLabelFieldXML, TLabelField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importLabelFieldFromXML = (xml: TLabelFieldXML | undefined): TLabelField | undefined => {
  if (!xml) return undefined

   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.LabelField,
    autoCellHeight: xml.AutoCellHeight,
    cellHyperlink: xml.CellHyperlink,
    contextMenu: importFormGroupFromXML(xml.ContextMenu),
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    editMode: xml.EditMode,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    fixingInTable: xml.FixingInTable,
    footerBackColor: importColorFromXML(xml.FooterBackColor),
    footerDataPath: xml.FooterDataPath,
    footerFont: importFontFromXML(xml.FooterFont),
    footerHorizontalAlign: xml.FooterHorizontalAlign,
    footerPicture: importPictureFromXML(xml.FooterPicture),
    footerText: importI8nTextFromXML(xml.FooterText),
    footerTextColor: importColorFromXML(xml.FooterTextColor),
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    horizontalAlign: xml.HorizontalAlign,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    showInFooter: xml.ShowInFooter,
    showInHeader: xml.ShowInHeader,
    skipOnInput: xml.SkipOnInput,
    table: importTableFromXML(xml.Table),
    title: importI8nTextFromXML(xml.Title),
    titleBackColor: importColorFromXML(xml.TitleBackColor),
    titleFont: importFontFromXML(xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    typeRestriction: importTypeDescriptionFromXML(xml.TypeRestriction),
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    warningOnEdit: importI8nTextFromXML(xml.WarningOnEdit),
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    format: importI8nTextFromXML(xml.Format),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    hyperlink: xml.Hyperlink,
    markNegatives: xml.MarkNegatives,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    passwordMode: xml.PasswordMode,
    textColor: importColorFromXML(xml.TextColor),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: xml.Events ? {
       onChange: xml.Events.OnChange,
       click: xml.Events.Click,
       uRLProcessing: xml.Events.URLProcessing,
    } : undefined,
  }
}

registerImport(ZElementType.enum.LabelField, importLabelFieldFromXML)