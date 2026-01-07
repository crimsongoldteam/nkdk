import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { GanttChartField, GanttChartFieldEnterprise } from "~/metadata/forms/elements/ganttChartField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importGanttChartFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
    ПередРазворачиванием?: string
    ПередСворачиванием?: string
    ПриАктивизацииЗначения?: string
    ПриАктивизацииИнтервала?: string
    ПриОкончанииРедактированияИнтервала?: string
  } | undefined
): {
  onChange?: string
  selection?: string
  detailProcessing?: string
  beforeExpand?: string
  beforeCollapse?: string
  onActivateValue?: string
  onActivateInterval?: string
  onIntervalEditEnd?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    selection?: string
    detailProcessing?: string
    beforeExpand?: string
    beforeCollapse?: string
    onActivateValue?: string
    onActivateInterval?: string
    onIntervalEditEnd?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.ОбработкаРасшифровки !== undefined) result.detailProcessing = data.ОбработкаРасшифровки
  if (data.ПередРазворачиванием !== undefined) result.beforeExpand = data.ПередРазворачиванием
  if (data.ПередСворачиванием !== undefined) result.beforeCollapse = data.ПередСворачиванием
  if (data.ПриАктивизацииЗначения !== undefined) result.onActivateValue = data.ПриАктивизацииЗначения
  if (data.ПриАктивизацииИнтервала !== undefined) result.onActivateInterval = data.ПриАктивизацииИнтервала
  if (data.ПриОкончанииРедактированияИнтервала !== undefined) result.onIntervalEditEnd = data.ПриОкончанииРедактированияИнтервала

  return Object.keys(result).length > 0 ? result : undefined
}

export const importGanttChartFieldFromEnterprise = (
  context: ConfigurationContext,
  data: GanttChartFieldEnterprise | undefined,
  name: string
): GanttChartField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: GanttChartField = {
    elementType: FormElementType.GanttChartField,
    ...restFields,
  }

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
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
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

  const events = importGanttChartFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "GanttChartField", importGanttChartFieldFromEnterprise)
