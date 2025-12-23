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
  configurationSettings: ConfigurationSettings, data: GanttChartField | undefined
): GanttChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    ВертикальныеЛинии: exportBooleanToEnterprise(configurationSettings, data.verticalLines),
    Высота: data.height,
    ГоризонтальныеЛинии: exportBooleanToEnterprise(configurationSettings, data.horizontalLines),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ПоложениеТаблицы: exportSystemEnumerationToEnterprise(configurationSettings, data.tableLocation, SE.GanttChartTableLocationToEnterprise),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РежимВыделенияЗначений: exportSystemEnumerationToEnterprise(configurationSettings, data.valuesSelectionMode, SE.GanttChartValuesSelectionModeToEnterprise),
    РежимВыделенияИнтервалов: exportSystemEnumerationToEnterprise(configurationSettings, data.intervalsSelectionMode, SE.GanttChartIntervalsSelectionModeToEnterprise),
    Ширина: data.width,
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "GanttChartField", exportGanttChartFieldToEnterprise)
