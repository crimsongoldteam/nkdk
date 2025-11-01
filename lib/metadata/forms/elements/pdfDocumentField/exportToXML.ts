import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPdfDocumentFieldXML, TPdfDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportPdfDocumentFieldToXML = (data: TPdfDocumentField | undefined): TPdfDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TPdfDocumentFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    CurrentPageNumber: data.currentPageNumber,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Orientation: data.orientation,
    Output: data.output,
    Scale: data.scale,
    UsedFileName: data.usedFileName,
    VerticalStretch: data.verticalStretch,
    ViewStatusLocation: data.viewStatusLocation,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.PdfDocumentField, exportPdfDocumentFieldToXML)