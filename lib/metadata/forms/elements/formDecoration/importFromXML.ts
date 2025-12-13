import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { FormElementType } from "../types"
import { FormDecoration, FormDecorationXML } from "./types"

export const importFormDecorationFromXML = (xml: FormDecorationXML | undefined): FormDecoration | undefined => {
  if (!xml) return undefined
   
  return {
...importBaseElementFromXML(xml)!,
elementType: FormElementType.FormDecoration,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(xml.TextColor),
    title: importI8nTextFromXML(xml.Title),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
  }
}

registerImport(FormElementType.FormDecoration, importFormDecorationFromXML)