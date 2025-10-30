import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TFormFieldXML, TFormField, TFormDecoration, TFormDecorationXML } from "./types"

export const importFormDecorationFromXML = (xml: TFormDecorationXML | undefined): TFormDecoration | undefined => {
  if (!xml) return undefined
  return {
    ...importBaseElementFromXML(xml),
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    displayImportance: xml.DisplayImportance,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    type: xml.Type,
    visible: xml.Visible,
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(xml.Title),
    contextMenu: xml.ContextMenu,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    toolTipRepresentation: xml.ToolTipRepresentation,
    toolTip: importI8nTextFromXML(xml.ToolTip),
    skipOnInput: xml.SkipOnInput,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    shortcut: xml.Shortcut,
    textColor: importColorFromXML(xml.TextColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}
