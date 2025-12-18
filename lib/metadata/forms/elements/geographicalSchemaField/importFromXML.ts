import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldXML,
} from "~/lib/metadata/forms/elements/geographicalSchemaField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importGeographicalSchemaFieldFromXML = (
  xml: GeographicalSchemaFieldXML | undefined,
  configurationSettings: ConfigurationSettings
): GeographicalSchemaField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml, configurationSettings)!,
    elementType: FormElementType.GeographicalSchemaField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    events: importEventsFromXML(xml.Events, configurationSettings),
  }
}

registerMetadata("ImportFromXML", "GeographicalSchemaField", importGeographicalSchemaFieldFromXML)
