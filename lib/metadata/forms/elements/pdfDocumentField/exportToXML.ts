import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportPdfDocumentFieldToXML = (data: PdfDocumentField | undefined): PdfDocumentFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

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
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.PdfDocumentField, exportPdfDocumentFieldToXML)
