import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { GraphicalSchemaField, GraphicalSchemaFieldXML } from "~/lib/metadata/forms/elements/graphicalSchemaField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportGraphicalSchemaFieldToXML = (
  data: GraphicalSchemaField | undefined,
  configurationSettings: ConfigurationSettings
): GraphicalSchemaFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    Edit: data.edit,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "GraphicalSchemaField", exportGraphicalSchemaFieldToXML)
