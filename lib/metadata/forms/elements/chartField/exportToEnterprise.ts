import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ChartField, ChartFieldEnterprise } from "~/lib/metadata/forms/elements/chartField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"

export const exportChartFieldToEnterprise = (
  data: ChartField | undefined,
  configurationSettings: ConfigurationSettings
): ChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Events: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.ChartField, exportChartFieldToEnterprise)
