import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { GanttChartField, GanttChartFieldEnterprise } from "~/lib/metadata/forms/elements/ganttChartField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportGanttChartFieldToEnterprise = (
  data: GanttChartField | undefined,
  configurationSettings: ConfigurationSettings
): GanttChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ВертикальныеЛинии: exportBooleanToEnterprise(data.verticalLines, configurationSettings),
    Высота: data.height,
    ГоризонтальныеЛинии: exportBooleanToEnterprise(data.horizontalLines, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ПоложениеТаблицы: exportSystemEnumerationToEnterprise(
      data.tableLocation,
      SE.GanttChartTableLocationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    РежимВыделенияЗначений: exportSystemEnumerationToEnterprise(
      data.valuesSelectionMode,
      SE.GanttChartValuesSelectionModeToEnterprise,
      configurationSettings
    ),
    РежимВыделенияИнтервалов: exportSystemEnumerationToEnterprise(
      data.intervalsSelectionMode,
      SE.GanttChartIntervalsSelectionModeToEnterprise,
      configurationSettings
    ),
    Ширина: data.width,
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "GanttChartField", exportGanttChartFieldToEnterprise)
