import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TFormFieldXML, TFormField } from "./types"


export const importFormFieldFromXML = (xml: TFormFieldXML | undefined): TFormField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
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
     toolTip: importI8nTextFromXML(xml.ToolTip),
     titleLocation: xml.TitleLocation,
     warningOnEdit: xml.WarningOnEdit,
     skipOnInput: xml.SkipOnInput,
     dataPath: xml.DataPath,
     footerDataPath: xml.FooterDataPath,
     extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
     editMode: xml.EditMode,
     shortcut: xml.Shortcut,
     table: xml.Table,
     footerText: importI8nTextFromXML(xml.FooterText),
     readOnly: xml.ReadOnly,
     fixingInTable: xml.FixingInTable,
     titleTextColor: importColorFromXML(xml.TitleTextColor),
     footerTextColor: importColorFromXML(xml.FooterTextColor),
     titleBackColor: importColorFromXML(xml.TitleBackColor),
     footerBackColor: importColorFromXML(xml.FooterBackColor),
     titleFont: importFontFromXML(xml.TitleFont),
     footerFont: importFontFromXML(xml.FooterFont),
  }
}