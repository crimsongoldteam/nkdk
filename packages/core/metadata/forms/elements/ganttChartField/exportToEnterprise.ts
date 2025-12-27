import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/packages/core/metadata/forms/elements/formField/exportToEnterprise"
import {
  GanttChartField,
  GanttChartFieldEnterprise,
} from "~/packages/core/metadata/forms/elements/ganttChartField/types"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportGanttChartFieldToEnterprise = (
  context: Context,
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
