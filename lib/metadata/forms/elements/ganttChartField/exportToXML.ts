import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportGanttChartFieldToXML = (data: GanttChartField | undefined): GanttChartFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalLines: data.horizontalLines,
    HorizontalStretch: data.horizontalStretch,
    IntervalsSelectionMode: data.intervalsSelectionMode,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TableLocation: data.tableLocation,
    ValuesSelectionMode: data.valuesSelectionMode,
    VerticalLines: data.verticalLines,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.GanttChartField, exportGanttChartFieldToXML)
