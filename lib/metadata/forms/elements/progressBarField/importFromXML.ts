import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { ProgressBarField, ProgressBarFieldXML } from "~/lib/metadata/forms/elements/progressBarField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importProgressBarFieldFromXML = (
  xml: ProgressBarFieldXML | undefined,
  configurationSettings: ConfigurationSettings
): ProgressBarField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(xml, configurationSettings)!,
    elementType: FormElementType.ProgressBarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    representation: xml.Representation,
    showPercent: xml.ShowPercent,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(xml.Events, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "ProgressBarField", importProgressBarFieldFromXML)
