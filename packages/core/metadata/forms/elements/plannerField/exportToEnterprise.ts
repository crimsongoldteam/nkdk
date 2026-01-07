import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { PlannerField, PlannerFieldEnterprise } from "~/metadata/forms/elements/plannerField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPlannerFieldToEnterprise = (
  context: ConfigurationContext,
  data: PlannerField | undefined
): PlannerFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormFieldToEnterprise(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Высота: data.height,
    ГиперссылкаПеренесенногоЗаголовкаШкалыВремени: exportBooleanToEnterprise(
      context,
      data.wrappedTimeScaleHeaderHyperlink
    ),
    ГиперссылкаЭлементаИзмерения: exportBooleanToEnterprise(context, data.dimensionItemHyperlink),
    ГиперссылкаЭлементаШкалыВремени: exportBooleanToEnterprise(context, data.timeScaleItemHyperlink),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),  }
}

registerMetadata("ExportToEnterprise", "PlannerField", exportPlannerFieldToEnterprise)
