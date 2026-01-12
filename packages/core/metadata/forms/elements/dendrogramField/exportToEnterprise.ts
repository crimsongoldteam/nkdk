import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
} from "~/metadata/forms/elements/dendrogramField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportDendrogramFieldTypedToEnterprise = (
  context: ConfigurationContext,
  data: DendrogramField | undefined
): DendrogramFieldTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportDendrogramFieldPropsToEnterprise(context, data)

  const result: DendrogramFieldTypedEnterprise = {
    Тип: "ПолеДендрограммы",
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

export const exportDendrogramFieldPartialToEnterprise = (
  context: ConfigurationContext,
  data: DendrogramField
): DendrogramFieldPartialEnterprise => {
  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportDendrogramFieldPropsToEnterprise(context, data)

  const result: DendrogramFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

const exportDendrogramFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: DendrogramField
): DendrogramFieldPartialEnterprise => {
  const result: DendrogramFieldPartialEnterprise = {}

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

registerMetadata("ExportPartialToEnterprise", "DendrogramField", exportDendrogramFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "DendrogramField", exportDendrogramFieldTypedToEnterprise)
