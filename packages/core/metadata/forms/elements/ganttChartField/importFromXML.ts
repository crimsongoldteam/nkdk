import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { GanttChartField, GanttChartFieldXML } from "~/metadata/forms/elements/ganttChartField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importGanttChartFieldFromXML = (
  context: ConfigurationContext,
  xml: GanttChartFieldXML | undefined
): GanttChartField | undefined => {
  if (!xml) return undefined
  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,
    elementType: FormElementType.GanttChartField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalLines: xml.HorizontalLines,
    horizontalStretch: xml.HorizontalStretch,
    intervalsSelectionMode: xml.IntervalsSelectionMode,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    tableLocation: xml.TableLocation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    valuesSelectionMode: xml.ValuesSelectionMode,
    verticalLines: xml.VerticalLines,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  }
}

registerMetadata("ImportFromXML", "GanttChartField", importGanttChartFieldFromXML)
