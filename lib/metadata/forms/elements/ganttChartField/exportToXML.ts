import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { GanttChartField, GanttChartFieldXML } from "~/lib/metadata/forms/elements/ganttChartField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportGanttChartFieldToXML = (
  data: GanttChartField | undefined,
  configurationSettings: ConfigurationSettings
): GanttChartFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(data, configurationSettings)!,

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
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "GanttChartField", exportGanttChartFieldToXML)
