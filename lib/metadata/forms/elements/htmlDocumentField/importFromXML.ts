import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { THTMLDocumentFieldXML, THTMLDocumentField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importHTMLDocumentFieldFromXML = (xml: THTMLDocumentFieldXML | undefined): THTMLDocumentField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.HTMLDocumentField,
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

registerImport(ZElementType.enum.HTMLDocumentField, importHTMLDocumentFieldFromXML)