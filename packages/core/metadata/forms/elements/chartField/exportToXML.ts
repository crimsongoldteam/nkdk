import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField, ChartFieldXML } from "~/metadata/forms/elements/chartField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function exportChartFieldToXML<From extends ChartField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: ChartFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "ChartField", exportChartFieldToXML)
