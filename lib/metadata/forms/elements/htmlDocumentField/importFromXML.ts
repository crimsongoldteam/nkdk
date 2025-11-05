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
    borderColor: importColorFromXML(xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userAgentInformation: xml.UserAgentInformation,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: xml.Events ? {
       documentComplete: xml.Events.DocumentComplete,
       beforeWrite: xml.Events.BeforeWrite,
       beforePrint: xml.Events.BeforePrint,
       afterWrite: xml.Events.AfterWrite,
       onClick: xml.Events.OnClick,
    } : undefined,
  }
}

registerImport(ZElementType.enum.HTMLDocumentField, importHTMLDocumentFieldFromXML)