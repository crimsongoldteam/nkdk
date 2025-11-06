import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { TSearchControlAdditionXML, TSearchControlAddition } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSearchControlAdditionFromXML = (xml: TSearchControlAdditionXML | undefined): TSearchControlAddition | undefined => {
  if (!xml) return undefined
   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.SearchControlAddition,
    contextMenu: importFormGroupFromXML(xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedToolTip: importFormDecorationFromXML(xml.ExtendedToolTip),
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    title: importI8nTextFromXML(xml.Title),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    childItems: importChildItemsFromXML(xml.ChildItems),
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(xml.TextColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.SearchControlAddition, importSearchControlAdditionFromXML)