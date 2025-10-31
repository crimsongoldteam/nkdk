import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPdfDocumentFieldXML, TPdfDocumentField } from "./types"

export const exportPdfDocumentFieldToXML = (data: TPdfDocumentField | undefined): TPdfDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Output: data.output,
    Height: data.height,
    UsedFileName: data.usedFileName,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Scale: data.scale,
    CurrentPageNumber: data.currentPageNumber,
    Orientation: data.orientation,
    ViewStatusLocation: data.viewStatusLocation,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
  }
}