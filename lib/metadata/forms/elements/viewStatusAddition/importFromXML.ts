import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importViewStatusAdditionFromXML = (xml: TViewStatusAdditionXML | undefined): TViewStatusAddition | undefined => {
  if (!xml) return undefined

   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.ViewStatusAddition,
    contextMenu: importFormGroupFromXML(xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedToolTip: importFormDecorationFromXML(xml.ExtendedToolTip),
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    title: importI8nTextFromXML(xml.Title),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
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

registerImport(ZElementType.enum.ViewStatusAddition, importViewStatusAdditionFromXML)