import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { ChartField, ChartFieldEnterprise } from "~/packages/core/metadata/forms/elements/chartField/types"
import { exportFormFieldToEnterprise } from "~/packages/core/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportChartFieldToEnterprise = (
  context: Context,
  data: ChartField | undefined
): ChartFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Высота: data.height,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "ChartField", exportChartFieldToEnterprise)
