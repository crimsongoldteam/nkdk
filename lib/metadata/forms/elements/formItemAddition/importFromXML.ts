import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { FormElementType } from "../types"
import { FormItemAddition, FormItemAdditionXML } from "./types"

export const importFormItemAdditionFromXML = (xml: FormItemAdditionXML | undefined): FormItemAddition | undefined => {
  if (!xml) return undefined

  return {
    ...importBaseElementFromXML(xml)!,
    elementType: FormElementType.FormItemAddition,

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
  }
}

registerImport(FormElementType.FormItemAddition, importFormItemAdditionFromXML)
