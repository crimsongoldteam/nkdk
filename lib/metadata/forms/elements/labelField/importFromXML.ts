import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TLabelFieldXML, TLabelField } from "./types"

export const importLabelFieldFromXML = (xml: TLabelFieldXML | undefined): TLabelField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    markNegatives: xml.MarkNegatives,
    height: xml.Height,
    hyperlink: xml.Hyperlink,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    border: importBorderFromXML(xml.Border),
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    passwordMode: xml.PasswordMode,
    format: xml.Format,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}