import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
} from "~/metadata/forms/elements/plannerField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPlannerFieldTypedToEnterprise = (
  context: ConfigurationContext,
  data: PlannerField | undefined
): PlannerFieldTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportPlannerFieldPropsToEnterprise(context, data)

  const result: PlannerFieldTypedEnterprise = {
    Тип: "ПолеПланировщика",
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

export const exportPlannerFieldPartialToEnterprise = (
  context: ConfigurationContext,
  data: PlannerField
): PlannerFieldPartialEnterprise => {
  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportPlannerFieldPropsToEnterprise(context, data)

  const result: PlannerFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

const exportPlannerFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: PlannerField
): PlannerFieldPartialEnterprise => {
  const result: PlannerFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.height !== undefined) result.Высота = data.height

  const wrappedTimeScaleHeaderHyperlink = exportBooleanToEnterprise(context, data.wrappedTimeScaleHeaderHyperlink)
  if (wrappedTimeScaleHeaderHyperlink !== undefined)
    result.ГиперссылкаПеренесенногоЗаголовкаШкалыВремени = wrappedTimeScaleHeaderHyperlink

  const dimensionItemHyperlink = exportBooleanToEnterprise(context, data.dimensionItemHyperlink)
  if (dimensionItemHyperlink !== undefined) result.ГиперссылкаЭлементаИзмерения = dimensionItemHyperlink

  const timeScaleItemHyperlink = exportBooleanToEnterprise(context, data.timeScaleItemHyperlink)
  if (timeScaleItemHyperlink !== undefined) result.ГиперссылкаЭлементаШкалыВремени = timeScaleItemHyperlink

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableStartDrag = exportBooleanToEnterprise(context, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "PlannerField", exportPlannerFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "PlannerField", exportPlannerFieldTypedToEnterprise)
