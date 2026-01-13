import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
} from "~/metadata/forms/elements/ganttChartField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importGanttChartFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: GanttChartFieldTypedEnterprise | undefined,
  name: string
): GanttChartField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importGanttChartFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: GanttChartField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importGanttChartFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: GanttChartField | undefined,
  data: GanttChartFieldPartialEnterprise | undefined
): GanttChartField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importGanttChartFieldPropsFromEnterprise(context, data)
  const result: GanttChartField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importGanttChartFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: GanttChartFieldTypedEnterprise | GanttChartFieldPartialEnterprise | undefined
): Omit<Partial<GanttChartField>, "elementType" | "name"> => {
  const result: Omit<Partial<GanttChartField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const verticalLines = importBooleanFromEnterprise(context, data.ВертикальныеЛинии)
  if (verticalLines !== undefined) result.verticalLines = verticalLines

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalLines = importBooleanFromEnterprise(context, data.ГоризонтальныеЛинии)
  if (horizontalLines !== undefined) result.horizontalLines = horizontalLines

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const tableLocation = importSystemEnumerationFromEnterprise<SE.GanttChartTableLocation>(
    context,
    data.ПоложениеТаблицы,
    SE.GanttChartTableLocationFromEnterprise
  )
  if (tableLocation !== undefined) result.tableLocation = tableLocation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const valuesSelectionMode = importSystemEnumerationFromEnterprise<SE.GanttChartValuesSelectionMode>(
    context,
    data.РежимВыделенияЗначений,
    SE.GanttChartValuesSelectionModeFromEnterprise
  )
  if (valuesSelectionMode !== undefined) result.valuesSelectionMode = valuesSelectionMode

  const intervalsSelectionMode = importSystemEnumerationFromEnterprise<SE.GanttChartIntervalsSelectionMode>(
    context,
    data.РежимВыделенияИнтервалов,
    SE.GanttChartIntervalsSelectionModeFromEnterprise
  )
  if (intervalsSelectionMode !== undefined) result.intervalsSelectionMode = intervalsSelectionMode

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "GanttChartField", importGanttChartFieldPropsFromEnterprise)
