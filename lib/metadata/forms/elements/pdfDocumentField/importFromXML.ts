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
    output: xml.Output,
    height: xml.Height,
    usedFileName: xml.UsedFileName,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    scale: xml.Scale,
    currentPageNumber: xml.CurrentPageNumber,
    orientation: xml.Orientation,
    viewStatusLocation: xml.ViewStatusLocation,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.PdfDocumentField, importPdfDocumentFieldFromXML)