import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldXML,
} from "~/metadata/forms/elements/geographicalSchemaField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importGeographicalSchemaFieldFromXML = (
  context: ConfigurationContext,
  xml: GeographicalSchemaFieldXML | undefined
): GeographicalSchemaField | undefined => {
  if (!xml) return undefined
  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,
    elementType: FormElementType.GeographicalSchemaField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  }
}

registerMetadata("ImportFromXML", "GeographicalSchemaField", importGeographicalSchemaFieldFromXML)
