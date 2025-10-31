import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { THtmlDocumentFieldXML, THtmlDocumentField } from "./types"

export const importHtmlDocumentFieldFromXML = (xml: THtmlDocumentFieldXML | undefined): THtmlDocumentField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    output: xml.Output,
    height: xml.Height,
    userAgentInformation: xml.UserAgentInformation,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
  }
}