import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { GanttChartField, GanttChartFieldXML } from "~/metadata/forms/elements/ganttChartField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function exportGanttChartFieldToXML<From extends GanttChartField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: GanttChartFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalLines !== undefined) result.HorizontalLines = data.horizontalLines

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.intervalsSelectionMode !== undefined) result.IntervalsSelectionMode = data.intervalsSelectionMode

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.tableLocation !== undefined) result.TableLocation = data.tableLocation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.valuesSelectionMode !== undefined) result.ValuesSelectionMode = data.valuesSelectionMode

  if (data.verticalLines !== undefined) result.VerticalLines = data.verticalLines

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "GanttChartField", exportGanttChartFieldToXML)
