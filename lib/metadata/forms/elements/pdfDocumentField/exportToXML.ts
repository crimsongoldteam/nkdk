import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { PdfDocumentField, PdfDocumentFieldXML } from "~/lib/metadata/forms/elements/pdfDocumentField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPdfDocumentFieldToXML = (
  data: PdfDocumentField | undefined,
  configurationSettings: ConfigurationSettings
): PdfDocumentFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
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
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "PdfDocumentField", exportPdfDocumentFieldToXML)
