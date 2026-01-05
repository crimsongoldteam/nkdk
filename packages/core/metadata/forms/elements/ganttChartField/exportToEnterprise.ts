import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { GanttChartField, GanttChartFieldEnterprise } from "~/metadata/forms/elements/ganttChartField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportGanttChartFieldToEnterprise = (
  context: ConfigurationContext,
  data: GanttChartField | undefined
): GanttChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    ВертикальныеЛинии: exportBooleanToEnterprise(context, data.verticalLines),
    Высота: data.height,
    ГоризонтальныеЛинии: exportBooleanToEnterprise(context, data.horizontalLines),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ПоложениеТаблицы: exportSystemEnumerationToEnterprise(
      context,
      data.tableLocation,
      SE.GanttChartTableLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РежимВыделенияЗначений: exportSystemEnumerationToEnterprise(
      context,
      data.valuesSelectionMode,
      SE.GanttChartValuesSelectionModeToEnterprise
    ),
    РежимВыделенияИнтервалов: exportSystemEnumerationToEnterprise(
      context,
      data.intervalsSelectionMode,
      SE.GanttChartIntervalsSelectionModeToEnterprise
    ),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "GanttChartField", exportGanttChartFieldToEnterprise)
