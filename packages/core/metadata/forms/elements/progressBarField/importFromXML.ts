import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { ProgressBarField, ProgressBarFieldXML } from "~/metadata/forms/elements/progressBarField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importProgressBarFieldFromXML<To extends ProgressBarField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const { elementType: _, ...restFields } = baseFields

  const result: ProgressBarField = {
    elementType: FormElementType.ProgressBarField,
    ...restFields,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxValue !== undefined) result.maxValue = xml.MaxValue

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.MinValue !== undefined) result.minValue = xml.MinValue

  if (xml.Orientation !== undefined) result.orientation = xml.Orientation

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.ShowPercent !== undefined) result.showPercent = xml.ShowPercent

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "ProgressBarField", importProgressBarFieldFromXML)
