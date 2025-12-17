import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PlannerField, PlannerFieldEnterprise } from "~/lib/metadata/forms/elements/plannerField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"

export const exportPlannerFieldToEnterprise = (data: PlannerField | undefined): PlannerFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ГиперссылкаЭлементаИзмерения: exportBooleanToEnterprise(data.dimensionItemHyperlink),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ГиперссылкаЭлементаШкалыВремени: exportBooleanToEnterprise(data.timeScaleItemHyperlink),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ГиперссылкаПеренесенногоЗаголовкаШкалыВремени: exportBooleanToEnterprise(data.wrappedTimeScaleHeaderHyperlink),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.PlannerField, exportPlannerFieldToEnterprise)
