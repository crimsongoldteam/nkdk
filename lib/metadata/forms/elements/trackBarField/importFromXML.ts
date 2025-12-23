import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { TrackBarField, TrackBarFieldXML } from "~/lib/metadata/forms/elements/trackBarField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importTrackBarFieldFromXML = (
  configurationSettings: ConfigurationSettings, xml: TrackBarFieldXML | undefined
): TrackBarField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.TrackBarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    largeStep: xml.LargeStep,
    markingAppearance: xml.MarkingAppearance,
    markingStep: xml.MarkingStep,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    step: xml.Step,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "TrackBarField", importTrackBarFieldFromXML)
