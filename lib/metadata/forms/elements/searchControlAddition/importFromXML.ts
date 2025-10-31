import { importColorFromXML } from "~/lib/metadata/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/font/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TSearchControlAdditionXML, TSearchControlAddition } from "./types"

export const importSearchControlAdditionFromXML = (xml: TSearchControlAdditionXML | undefined): TSearchControlAddition | undefined => {
  if (!xml) return undefined 

  const base = importFormItemAdditionFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxWidth: xml.AutoMaxWidth,
    maxWidth: xml.MaxWidth,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    backColor: importColorFromXML(xml.BackColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
  }
}