import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { GanttChartField, GanttChartFieldXML } from "~/lib/metadata/forms/elements/ganttChartField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportGanttChartFieldToXML = (
  configurationSettings: Context,
  data: GanttChartField | undefined
): GanttChartFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(configurationSettings, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalLines: data.horizontalLines,
    HorizontalStretch: data.horizontalStretch,
    IntervalsSelectionMode: data.intervalsSelectionMode,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TableLocation: data.tableLocation,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    ValuesSelectionMode: data.valuesSelectionMode,
    VerticalLines: data.verticalLines,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "GanttChartField", exportGanttChartFieldToXML)
