import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { TrackBarField, TrackBarFieldXML } from "~/metadata/forms/elements/trackBarField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportTrackBarFieldToXML = (
  context: ConfigurationContext,
  data: TrackBarField | undefined
): TrackBarFieldXML | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    LargeStep: data.largeStep,
    MarkingAppearance: data.markingAppearance,
    MarkingStep: data.markingStep,
    MaxHeight: data.maxHeight,
    MaxValue: data.maxValue,
    MaxWidth: data.maxWidth,
    MinValue: data.minValue,
    Orientation: data.orientation,
    Step: data.step,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),  }
}

registerMetadata("ExportToXML", "TrackBarField", exportTrackBarFieldToXML)
