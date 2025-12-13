import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
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
import { ViewStatusAddition, ViewStatusAdditionXML } from "./types"

export const importViewStatusAdditionFromXML = (xml: ViewStatusAdditionXML | undefined): ViewStatusAddition | undefined => {
  if (!xml) return undefined
   
  return {
...importFormItemAdditionFromXML(xml)!,
elementType: FormElementType.ViewStatusAddition,

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
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    buttonsBackColor: importColorFromXML(xml.ButtonsBackColor),
    font: importFontFromXML(xml.Font),
    horizontalAlign: xml.HorizontalAlign,
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(xml.TextColor),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    width: xml.Width,
  }
}

registerImport(FormElementType.ViewStatusAddition, importViewStatusAdditionFromXML)