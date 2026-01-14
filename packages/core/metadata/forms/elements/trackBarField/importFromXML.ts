import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { TrackBarField } from "~/metadata/forms/elements/trackBarField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importTrackBarFieldFromXML<To extends TrackBarField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)

  const result: TrackBarField = {
    ...baseFields,
    elementType: FormElementType.TrackBarField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.LargeStep !== undefined) result.largeStep = xml.LargeStep

  if (xml.MarkingAppearance !== undefined) result.markingAppearance = xml.MarkingAppearance

  if (xml.MarkingStep !== undefined) result.markingStep = xml.MarkingStep

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxValue !== undefined) result.maxValue = xml.MaxValue

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.MinValue !== undefined) result.minValue = xml.MinValue

  if (xml.Orientation !== undefined) result.orientation = xml.Orientation

  if (xml.Step !== undefined) result.step = xml.Step

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "TrackBarField", importTrackBarFieldFromXML)
