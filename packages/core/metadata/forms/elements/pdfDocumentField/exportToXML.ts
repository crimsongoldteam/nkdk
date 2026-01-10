import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { PdfDocumentField, PdfDocumentFieldXML } from "~/metadata/forms/elements/pdfDocumentField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportExportReturn } from "../types"

export const exportPdfDocumentFieldToXML = <T extends PdfDocumentField | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, PdfDocumentFieldXML> => {
  if (!data) return undefined as ImportExportReturn<T, PdfDocumentFieldXML>

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined as ImportExportReturn<T, PdfDocumentFieldXML>

  const result: PdfDocumentFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.currentPageNumber !== undefined) result.CurrentPageNumber = data.currentPageNumber

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.orientation !== undefined) result.Orientation = data.orientation

  if (data.output !== undefined) result.Output = data.output

  if (data.scale !== undefined) result.Scale = data.scale

  if (data.usedFileName !== undefined) result.UsedFileName = data.usedFileName

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.viewStatusLocation !== undefined) result.ViewStatusLocation = data.viewStatusLocation

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ImportExportReturn<T, PdfDocumentFieldXML>
}

registerMetadata("ExportToXML", "PdfDocumentField", exportPdfDocumentFieldToXML)
