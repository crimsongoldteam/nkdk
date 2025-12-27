import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToXML } from "~/packages/core/metadata/forms/elements/formField/exportToXML"
import { TrackBarField, TrackBarFieldXML } from "~/packages/core/metadata/forms/elements/trackBarField/types"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportTrackBarFieldToXML = (
  context: Context,
  data: TrackBarField | undefined
): TrackBarFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

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
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "TrackBarField", exportTrackBarFieldToXML)
