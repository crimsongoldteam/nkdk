import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { PdfDocumentField } from "~/metadata/forms/elements/pdfDocumentField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importPdfDocumentFieldFromXML<To extends PdfDocumentField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)

  const result: PdfDocumentField = {
    ...baseFields,
    elementType: FormElementType.PdfDocumentField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.CurrentPageNumber !== undefined) result.currentPageNumber = xml.CurrentPageNumber

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Orientation !== undefined) result.orientation = xml.Orientation

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.Scale !== undefined) result.scale = xml.Scale

  if (xml.UsedFileName !== undefined) result.usedFileName = xml.UsedFileName

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.ViewStatusLocation !== undefined) result.viewStatusLocation = xml.ViewStatusLocation

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "PdfDocumentField", importPdfDocumentFieldFromXML)
