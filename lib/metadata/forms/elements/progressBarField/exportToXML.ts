import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { ProgressBarField, ProgressBarFieldXML } from "~/lib/metadata/forms/elements/progressBarField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportProgressBarFieldToXML = (
  data: ProgressBarField | undefined,
  configurationSettings: ConfigurationSettings
): ProgressBarFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxValue: data.maxValue,
    MaxWidth: data.maxWidth,
    MinValue: data.minValue,
    Orientation: data.orientation,
    Representation: data.representation,
    ShowPercent: data.showPercent,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "ProgressBarField", exportProgressBarFieldToXML)
