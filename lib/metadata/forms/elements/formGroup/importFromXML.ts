import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { TFormGroupXML, TFormGroup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importFormGroupFromXML = (xml: TFormGroupXML | undefined): TFormGroup | undefined => {
  if (!xml) return undefined

  const base = importBaseElementFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.FormGroup,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    type: xml.Type,
    visible: xml.Visible,
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(xml.Title),
    toolTipRepresentation: xml.ToolTipRepresentation,
    toolTip: importI8nTextFromXML(xml.ToolTip),
    childItems: importChildItemsFromXML(xml.ChildItems),
    enableContentChange: xml.EnableContentChange,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    shortcut: xml.Shortcut,
    readOnly: xml.ReadOnly,
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    width: xml.Width,
    titleFont: importFontFromXML(xml.TitleFont),
  }
}

registerImport(ZElementType.enum.FormGroup, importFormGroupFromXML)