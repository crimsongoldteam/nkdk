import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { GanttChartField, GanttChartFieldXML } from "~/metadata/forms/elements/ganttChartField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importGanttChartFieldFromXML<To extends GanttChartField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const { elementType: _, ...restFields } = baseFields

  const result: GanttChartField = {
    elementType: FormElementType.GanttChartField,
    ...restFields,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalLines !== undefined) result.horizontalLines = xml.HorizontalLines

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.IntervalsSelectionMode !== undefined) result.intervalsSelectionMode = xml.IntervalsSelectionMode

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.TableLocation !== undefined) result.tableLocation = xml.TableLocation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.ValuesSelectionMode !== undefined) result.valuesSelectionMode = xml.ValuesSelectionMode

  if (xml.VerticalLines !== undefined) result.verticalLines = xml.VerticalLines

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "GanttChartField", importGanttChartFieldFromXML)
