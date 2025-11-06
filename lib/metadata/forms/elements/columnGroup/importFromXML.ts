import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TColumnGroupXML, TColumnGroup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importColumnGroupFromXML = (xml: TColumnGroupXML | undefined): TColumnGroup | undefined => {
  if (!xml) return undefined

   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.ColumnGroup,
    enableContentChange: xml.EnableContentChange,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    title: importI8nTextFromXML(xml.Title),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
    childItems: importChildItemsFromXML(xml.ChildItems),
    fixingInTable: xml.FixingInTable,
    group: xml.Group,
    headerDataPath: xml.HeaderDataPath,
    headerFormat: xml.HeaderFormat,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    showInHeader: xml.ShowInHeader,
    showTitle: xml.ShowTitle,
    titleBackColor: importColorFromXML(xml.TitleBackColor),
  }
}

registerImport(ZElementType.enum.ColumnGroup, importColumnGroupFromXML)