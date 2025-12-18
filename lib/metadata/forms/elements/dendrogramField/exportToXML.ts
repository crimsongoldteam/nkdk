import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { DendrogramField, DendrogramFieldXML } from "~/lib/metadata/forms/elements/dendrogramField/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportDendrogramFieldToXML = (
  data: DendrogramField | undefined,
  configurationSettings: ConfigurationSettings
): DendrogramFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "DendrogramField", exportDendrogramFieldToXML)
