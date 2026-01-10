import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PlannerField, PlannerFieldEnterprise } from "~/metadata/forms/elements/plannerField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

const importPlannerFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Выбор?: string
    НажатиеНаДействиеПланировщика?: string
    НажатиеНаНавигационнойСсылке?: string
    НажатиеНаПеренесенномЗаголовкеШкалыВремени?: string
    НажатиеНаЭлементеИзмерения?: string
    НажатиеНаЭлементеШкалыВремени?: string
    НачалоПеретаскивания?: string
    ОбработкаФормированияКоманд?: string
    ОкончаниеПеретаскивания?: string
    ПередНачаломБыстрогоРедактирования?: string
    ПередНачаломРедактирования?: string
    ПередПечатью?: string
    ПередРазворачиваниемЭлементаИзмерения?: string
    ПередСворачиваниемЭлементаИзмерения?: string
    ПередСозданием?: string
    ПередУдалением?: string
    Перетаскивание?: string
    ПриАктивизации?: string
    ПриОкончанииРедактирования?: string
    ПриСменеТекущегоПериодаОтображения?: string
    ПроверкаПеретаскивания?: string
    ПроверкаПеретаскиванияВнутри?: string
  } | undefined
): {
  onChange?: string
  selection?: string
  plannerActionClick?: string
  uRLClick?: string
  wrappedTimeScaleHeaderClick?: string
  dimensionItemClick?: string
  timeScaleItemClick?: string
  dragStart?: string
  commandGenerateProcessing?: string
  dragEnd?: string
  beforeStartQuickEdit?: string
  beforeStartEdit?: string
  beforePrint?: string
  beforeExpandDimensionItem?: string
  beforeCollapseDimensionItem?: string
  beforeCreate?: string
  beforeDelete?: string
  drag?: string
  onActivate?: string
  onEditEnd?: string
  onCurrentRepresentationPeriodChange?: string
  dragCheck?: string
  insideDragCheck?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    selection?: string
    plannerActionClick?: string
    uRLClick?: string
    wrappedTimeScaleHeaderClick?: string
    dimensionItemClick?: string
    timeScaleItemClick?: string
    dragStart?: string
    commandGenerateProcessing?: string
    dragEnd?: string
    beforeStartQuickEdit?: string
    beforeStartEdit?: string
    beforePrint?: string
    beforeExpandDimensionItem?: string
    beforeCollapseDimensionItem?: string
    beforeCreate?: string
    beforeDelete?: string
    drag?: string
    onActivate?: string
    onEditEnd?: string
    onCurrentRepresentationPeriodChange?: string
    dragCheck?: string
    insideDragCheck?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.НажатиеНаДействиеПланировщика !== undefined) result.plannerActionClick = data.НажатиеНаДействиеПланировщика
  if (data.НажатиеНаНавигационнойСсылке !== undefined) result.uRLClick = data.НажатиеНаНавигационнойСсылке
  if (data.НажатиеНаПеренесенномЗаголовкеШкалыВремени !== undefined)
    result.wrappedTimeScaleHeaderClick = data.НажатиеНаПеренесенномЗаголовкеШкалыВремени
  if (data.НажатиеНаЭлементеИзмерения !== undefined) result.dimensionItemClick = data.НажатиеНаЭлементеИзмерения
  if (data.НажатиеНаЭлементеШкалыВремени !== undefined) result.timeScaleItemClick = data.НажатиеНаЭлементеШкалыВремени
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОбработкаФормированияКоманд !== undefined) result.commandGenerateProcessing = data.ОбработкаФормированияКоманд
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.ПередНачаломБыстрогоРедактирования !== undefined)
    result.beforeStartQuickEdit = data.ПередНачаломБыстрогоРедактирования
  if (data.ПередНачаломРедактирования !== undefined) result.beforeStartEdit = data.ПередНачаломРедактирования
  if (data.ПередПечатью !== undefined) result.beforePrint = data.ПередПечатью
  if (data.ПередРазворачиваниемЭлементаИзмерения !== undefined)
    result.beforeExpandDimensionItem = data.ПередРазворачиваниемЭлементаИзмерения
  if (data.ПередСворачиваниемЭлементаИзмерения !== undefined)
    result.beforeCollapseDimensionItem = data.ПередСворачиваниемЭлементаИзмерения
  if (data.ПередСозданием !== undefined) result.beforeCreate = data.ПередСозданием
  if (data.ПередУдалением !== undefined) result.beforeDelete = data.ПередУдалением
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПриАктивизации !== undefined) result.onActivate = data.ПриАктивизации
  if (data.ПриОкончанииРедактирования !== undefined) result.onEditEnd = data.ПриОкончанииРедактирования
  if (data.ПриСменеТекущегоПериодаОтображения !== undefined)
    result.onCurrentRepresentationPeriodChange = data.ПриСменеТекущегоПериодаОтображения
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания
  if (data.ПроверкаПеретаскиванияВнутри !== undefined) result.insideDragCheck = data.ПроверкаПеретаскиванияВнутри

  return Object.keys(result).length > 0 ? result : undefined
}

export const importPlannerFieldFromEnterprise = <From extends PlannerFieldEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, PlannerField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, PlannerField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, PlannerField, Name> = {
    ...baseFields,
    elementType: FormElementType.PlannerField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  const wrappedTimeScaleHeaderHyperlink = importBooleanFromEnterprise(
    context,
    data.ГиперссылкаПеренесенногоЗаголовкаШкалыВремени
  )
  if (wrappedTimeScaleHeaderHyperlink !== undefined) result.wrappedTimeScaleHeaderHyperlink = wrappedTimeScaleHeaderHyperlink

  const dimensionItemHyperlink = importBooleanFromEnterprise(context, data.ГиперссылкаЭлементаИзмерения)
  if (dimensionItemHyperlink !== undefined) result.dimensionItemHyperlink = dimensionItemHyperlink

  const timeScaleItemHyperlink = importBooleanFromEnterprise(context, data.ГиперссылкаЭлементаШкалыВремени)
  if (timeScaleItemHyperlink !== undefined) result.timeScaleItemHyperlink = timeScaleItemHyperlink

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const enableStartDrag = importBooleanFromEnterprise(context, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importPlannerFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "PlannerField", importPlannerFieldFromEnterprise)
