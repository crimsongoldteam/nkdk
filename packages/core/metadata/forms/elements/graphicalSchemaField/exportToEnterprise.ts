import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
} from "~/metadata/forms/elements/graphicalSchemaField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportGraphicalSchemaFieldTypedToEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaField | undefined
): GraphicalSchemaFieldTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportGraphicalSchemaFieldPropsToEnterprise(context, data)

  const result: GraphicalSchemaFieldTypedEnterprise = {
    Тип: "ПолеГрафическойСхемы",
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

export const exportGraphicalSchemaFieldPartialToEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaField
): GraphicalSchemaFieldPartialEnterprise => {
  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportGraphicalSchemaFieldPropsToEnterprise(context, data)

  const result: GraphicalSchemaFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result)
}

const exportGraphicalSchemaFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaField
): GraphicalSchemaFieldPartialEnterprise => {
  const result: GraphicalSchemaFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const output = exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

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

  const edit = exportBooleanToEnterprise(context, data.edit)
  if (edit !== undefined) result.Редактирование = edit

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "GraphicalSchemaField", exportGraphicalSchemaFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "GraphicalSchemaField", exportGraphicalSchemaFieldTypedToEnterprise)
