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

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: TrackBarFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.largeStep !== undefined) result.LargeStep = data.largeStep

  if (data.markingAppearance !== undefined) result.MarkingAppearance = data.markingAppearance

  if (data.markingStep !== undefined) result.MarkingStep = data.markingStep

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxValue !== undefined) result.MaxValue = data.maxValue

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.minValue !== undefined) result.MinValue = data.minValue

  if (data.orientation !== undefined) result.Orientation = data.orientation

  if (data.step !== undefined) result.Step = data.step

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return result
}

registerMetadata("ExportToXML", "TrackBarField", exportTrackBarFieldToXML)
