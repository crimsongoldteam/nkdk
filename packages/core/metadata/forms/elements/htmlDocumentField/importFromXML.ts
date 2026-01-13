import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "~/metadata/forms/elements/htmlDocumentField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importHTMLDocumentFieldFromXML<From extends HTMLDocumentFieldXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const result: HTMLDocumentField = {
    ...baseFields,
    elementType: FormElementType.HTMLDocumentField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.UserAgentInformation !== undefined) result.userAgentInformation = xml.UserAgentInformation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "HTMLDocumentField", importHTMLDocumentFieldFromXML)
