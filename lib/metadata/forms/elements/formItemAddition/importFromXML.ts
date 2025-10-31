import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { TFormItemAdditionXML, TFormItemAddition } from "./types"
import { ZElementType } from "../types"

export const importFormItemAdditionFromXML = (xml: TFormItemAdditionXML | undefined): TFormItemAddition | undefined => {
  if (!xml) return undefined

  const base = importBaseElementFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.FormItemAddition,
    displayImportance: xml.DisplayImportance,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    type: xml.Type,
    visible: xml.Visible,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(xml.Title),
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
    toolTipRepresentation: xml.ToolTipRepresentation,
    toolTip: importI8nTextFromXML(xml.ToolTip),
    childItems: importChildItemsFromXML(xml.ChildItems),
    extendedToolTip: importFormDecorationFromXML(xml.ExtendedToolTip),
  }
}