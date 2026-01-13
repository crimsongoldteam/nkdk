import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField, DendrogramFieldXML } from "~/metadata/forms/elements/dendrogramField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importDendrogramFieldFromXML<From extends DendrogramFieldXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const result: DendrogramField = {
    ...baseFields,
    elementType: FormElementType.DendrogramField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "DendrogramField", importDendrogramFieldFromXML)
