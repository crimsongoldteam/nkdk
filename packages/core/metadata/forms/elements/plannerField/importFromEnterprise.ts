import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
} from "~/metadata/forms/elements/plannerField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importPlannerFieldTypedFromEnterprise<To extends PlannerField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): ImportExportReturn<ToTypedEnterpriseType<To>, To> {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importPlannerFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: PlannerField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as ImportExportReturn<ToTypedEnterpriseType<To>, To>
}

export function importPlannerFieldPartialFromEnterprise<To extends PlannerField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importPlannerFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importPlannerFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PlannerFieldTypedEnterprise | PlannerFieldPartialEnterprise | undefined
): Omit<Partial<PlannerField>, "elementType" | "name"> => {
  const result: Omit<Partial<PlannerField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  const wrappedTimeScaleHeaderHyperlink = importBooleanFromEnterprise(
    context,
    data.ГиперссылкаПеренесенногоЗаголовкаШкалыВремени
  )
  if (wrappedTimeScaleHeaderHyperlink !== undefined)
    result.wrappedTimeScaleHeaderHyperlink = wrappedTimeScaleHeaderHyperlink

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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "PlannerField", importPlannerFieldPropsFromEnterprise)
