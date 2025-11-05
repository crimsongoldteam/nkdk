import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPdfDocumentFieldXML, TPdfDocumentField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPdfDocumentFieldFromXML = (xml: TPdfDocumentFieldXML | undefined): TPdfDocumentField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.PdfDocumentField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor),
    currentPageNumber: xml.CurrentPageNumber,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    orientation: xml.Orientation,
    output: xml.Output,
    scale: xml.Scale,
    usedFileName: xml.UsedFileName,
    verticalStretch: xml.VerticalStretch,
    viewStatusLocation: xml.ViewStatusLocation,
    width: xml.Width,
    events: xml.Events ? {
       uRLClick: xml.Events.URLClick,
    } : undefined,
  }
}

registerImport(ZElementType.enum.PdfDocumentField, importPdfDocumentFieldFromXML)