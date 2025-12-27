import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToXML } from "~/packages/core/metadata/forms/elements/formField/exportToXML"
import { PdfDocumentField, PdfDocumentFieldXML } from "~/packages/core/metadata/forms/elements/pdfDocumentField/types"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportPdfDocumentFieldToXML = (
  context: Context,
  data: PdfDocumentField | undefined
): PdfDocumentFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(context, data.borderColor),
    CurrentPageNumber: data.currentPageNumber,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Orientation: data.orientation,
    Output: data.output,
    Scale: data.scale,
    UsedFileName: data.usedFileName,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    ViewStatusLocation: data.viewStatusLocation,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "PdfDocumentField", exportPdfDocumentFieldToXML)
