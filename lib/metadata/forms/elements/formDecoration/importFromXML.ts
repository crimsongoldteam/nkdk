import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { TFormDecorationXML, TFormDecoration } from "./types"
import { ZElementType } from "../types"

export const importFormDecorationFromXML = (xml: TFormDecorationXML | undefined): TFormDecoration | undefined => {
  if (!xml) return undefined

  const base = importBaseElementFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.FormDecoration,
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
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
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