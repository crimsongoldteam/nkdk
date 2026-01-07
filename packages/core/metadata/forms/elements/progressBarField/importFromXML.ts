import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { ProgressBarField, ProgressBarFieldXML } from "~/metadata/forms/elements/progressBarField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importProgressBarFieldFromXML = (
  context: ConfigurationContext,
  xml: ProgressBarFieldXML | undefined
): ProgressBarField | undefined => {
  if (!xml) return undefined

  return {
    const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,,
    elementType: FormElementType.ProgressBarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    representation: xml.Representation,
    showPercent: xml.ShowPercent,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),  }
}

registerMetadata("ImportFromXML", "ProgressBarField", importProgressBarFieldFromXML)
