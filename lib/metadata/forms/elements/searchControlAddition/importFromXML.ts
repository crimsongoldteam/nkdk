import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { FormElementType } from "../types"
import { SearchControlAddition, SearchControlAdditionXML } from "./types"

export const importSearchControlAdditionFromXML = (
  xml: SearchControlAdditionXML | undefined
): SearchControlAddition | undefined => {
  if (!xml) return undefined

  return {
    ...importFormItemAdditionFromXML(xml)!,
    elementType: FormElementType.SearchControlAddition,

    contextMenu: importCommandBarFromXML(xml.ContextMenu),
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

registerImport(FormElementType.SearchControlAddition, importSearchControlAdditionFromXML)
