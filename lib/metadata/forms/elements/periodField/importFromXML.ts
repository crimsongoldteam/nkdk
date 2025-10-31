import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPeriodFieldXML, TPeriodField } from "./types"

export const importPeriodFieldFromXML = (xml: TPeriodFieldXML | undefined): TPeriodField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    border: importBorderFromXML(xml.Border),
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}