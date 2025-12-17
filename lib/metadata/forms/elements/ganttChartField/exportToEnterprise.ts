import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { GanttChartField, GanttChartFieldEnterprise } from "~/lib/metadata/forms/elements/ganttChartField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportGanttChartFieldToEnterprise = (
  data: GanttChartField | undefined
): GanttChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    Высота: data.height,
    ГоризонтальныеЛинии: exportBooleanToEnterprise(data.horizontalLines),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    РежимВыделенияИнтервалов: exportSystemEnumerationToEnterprise(
      data.intervalsSelectionMode,
      SE.GanttChartIntervalsSelectionModeToEnterprise
    ),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ПоложениеТаблицы: exportSystemEnumerationToEnterprise(data.tableLocation, SE.GanttChartTableLocationToEnterprise),
    РежимВыделенияЗначений: exportSystemEnumerationToEnterprise(
      data.valuesSelectionMode,
      SE.GanttChartValuesSelectionModeToEnterprise
    ),
    ВертикальныеЛинии: exportBooleanToEnterprise(data.verticalLines),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.GanttChartField, exportGanttChartFieldToEnterprise)
