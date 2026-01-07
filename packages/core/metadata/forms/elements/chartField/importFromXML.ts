import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField, ChartFieldXML } from "~/metadata/forms/elements/chartField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importChartFieldFromXML = (
  context: ConfigurationContext,
  xml: ChartFieldXML | undefined
): ChartField | undefined => {
  if (!xml) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const result: ChartField = {
    ...baseFields,
    elementType: FormElementType.ChartField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "ChartField", importChartFieldFromXML)
