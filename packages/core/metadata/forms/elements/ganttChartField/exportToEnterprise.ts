import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
} from "~/metadata/forms/elements/ganttChartField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportGanttChartFieldTypedToEnterprise = (
  context: ConfigurationContext,
  data: GanttChartField | undefined
): GanttChartFieldTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportGanttChartFieldPropsToEnterprise(context, data)

  const result: GanttChartFieldTypedEnterprise = {
    Тип: "ПолеДиаграммыГанта",
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

export const exportGanttChartFieldPartialToEnterprise = (
  context: ConfigurationContext,
  data: GanttChartField
): GanttChartFieldPartialEnterprise => {
  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportGanttChartFieldPropsToEnterprise(context, data)

  const result: GanttChartFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

const exportGanttChartFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: GanttChartField
): GanttChartFieldPartialEnterprise => {
  const result: GanttChartFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const verticalLines = exportBooleanToEnterprise(context, data.verticalLines)
  if (verticalLines !== undefined) result.ВертикальныеЛинии = verticalLines

  if (data.height !== undefined) result.Высота = data.height

  const horizontalLines = exportBooleanToEnterprise(context, data.horizontalLines)
  if (horizontalLines !== undefined) result.ГоризонтальныеЛинии = horizontalLines

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const tableLocation = exportSystemEnumerationToEnterprise(
    context,
    data.tableLocation,
    SE.GanttChartTableLocationToEnterprise
  )
  if (tableLocation !== undefined) result.ПоложениеТаблицы = tableLocation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const valuesSelectionMode = exportSystemEnumerationToEnterprise(
    context,
    data.valuesSelectionMode,
    SE.GanttChartValuesSelectionModeToEnterprise
  )
  if (valuesSelectionMode !== undefined) result.РежимВыделенияЗначений = valuesSelectionMode

  const intervalsSelectionMode = exportSystemEnumerationToEnterprise(
    context,
    data.intervalsSelectionMode,
    SE.GanttChartIntervalsSelectionModeToEnterprise
  )
  if (intervalsSelectionMode !== undefined) result.РежимВыделенияИнтервалов = intervalsSelectionMode

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "GanttChartField", exportGanttChartFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "GanttChartField", exportGanttChartFieldTypedToEnterprise)
