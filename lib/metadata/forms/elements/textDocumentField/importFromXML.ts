import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { FormElementType } from "../types"
import { TextDocumentField, TextDocumentFieldXML } from "./types"

export const importTextDocumentFieldFromXML = (xml: TextDocumentFieldXML | undefined): TextDocumentField | undefined => {
  if (!xml) return undefined
   
  return {
...importFormFieldFromXML(xml)!,
elementType: FormElementType.TextDocumentField,

    autoCellHeight: xml.AutoCellHeight,
    cellHyperlink: xml.CellHyperlink,
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
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
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    warningOnEdit: importI8nTextFromXML(xml.WarningOnEdit),
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    selectedText: xml.SelectedText,
    textColor: importColorFromXML(xml.TextColor),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.TextDocumentField, importTextDocumentFieldFromXML)