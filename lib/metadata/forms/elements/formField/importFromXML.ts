import * as z from "zod"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { TFormField, TFormFieldXML } from "./types"

export const importFormFieldFromXML = (xml: TFormField): TFormFieldXML => {
  return {
    _id: xml._id,
    _name: xml._name,
    autoCellHeight: xml.AutoCellHeight,
    defaultItem: xml.DefaultItem,
    displayImportance: xml.DisplayImportance,
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    type: xml.Type,
    visible: xml.Visible,
    titleHeight: xml.TitleHeight,
    cellHyperlink: xml.CellHyperlink,
    horizontalAlign: xml.HorizontalAlign,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    footerHorizontalAlign: xml.FooterHorizontalAlign,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(xml.Title),
    footerPicture: importPictureFromXML(xml.FooterPicture),
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    contextMenu: xml.ContextMenu,
    typeRestriction: importTypeDescriptionFromXML(xml.TypeRestriction),
    showInFooter: xml.ShowInFooter,
    showInHeader: xml.ShowInHeader,
    toolTipRepresentation: xml.ToolTipRepresentation,
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    toolTip: xml.ToolTip,
    titleLocation: xml.TitleLocation,
    warningOnEdit: xml.WarningOnEdit,
    skipOnInput: xml.SkipOnInput,
    dataPath: xml.DataPath,
    footerDataPath: xml.FooterDataPath,
    extendedTooltip: xml.ExtendedTooltip,
    editMode: xml.EditMode,
    shortcut: xml.Shortcut,
    table: xml.Table,
    footerText: xml.FooterText,
    readOnly: xml.ReadOnly,
    fixingInTable: xml.FixingInTable,
    // titleTextColor: importColorFromXML(xml.TitleTextColor),
    // footerTextColor: importColorFromXML(xml.FooterTextColor),
    // titleBackColor: importColorFromXML(xml.TitleBackColor),
    // footerBackColor: importColorFromXML(xml.FooterBackColor),
    titleFont: importFontFromXML(xml.TitleFont),
    footerFont: importFontFromXML(xml.FooterFont),
  }
}
