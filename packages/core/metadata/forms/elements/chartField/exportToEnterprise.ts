import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ChartField,
  ChartFieldPartialEnterprise,
  ChartFieldTypedEnterprise,
} from "~/metadata/forms/elements/chartField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportChartFieldTypedToEnterprise<From extends ChartField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportChartFieldPropsToEnterprise(context, data)

  const result: ChartFieldTypedEnterprise = {
    Тип: "ПолеДиаграммы",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportChartFieldPartialToEnterprise<From extends ChartField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportChartFieldPropsToEnterprise(context, data)

  const result: ChartFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportChartFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: ChartField
): ChartFieldPartialEnterprise => {
  const result: ChartFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "ChartField", exportChartFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "ChartField", exportChartFieldTypedToEnterprise)
