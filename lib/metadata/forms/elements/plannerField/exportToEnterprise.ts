import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PlannerField, PlannerFieldEnterprise } from "~/lib/metadata/forms/elements/plannerField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"

export const exportPlannerFieldToEnterprise = (
  data: PlannerField | undefined,
  configurationSettings: ConfigurationSettings
): PlannerFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ГиперссылкаЭлементаИзмерения: exportBooleanToEnterprise(data.dimensionItemHyperlink, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ГиперссылкаЭлементаШкалыВремени: exportBooleanToEnterprise(data.timeScaleItemHyperlink, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    ГиперссылкаПеренесенногоЗаголовкаШкалыВремени: exportBooleanToEnterprise(
      data.wrappedTimeScaleHeaderHyperlink,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Events: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.PlannerField, exportPlannerFieldToEnterprise)
