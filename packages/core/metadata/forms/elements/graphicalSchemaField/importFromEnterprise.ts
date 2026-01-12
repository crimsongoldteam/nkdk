import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
} from "~/metadata/forms/elements/graphicalSchemaField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importGraphicalSchemaFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaFieldTypedEnterprise | undefined,
  name: string
): GraphicalSchemaField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importGraphicalSchemaFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: GraphicalSchemaField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importGraphicalSchemaFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: GraphicalSchemaField | undefined,
  data: GraphicalSchemaFieldPartialEnterprise | undefined
): GraphicalSchemaField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importGraphicalSchemaFieldPropsFromEnterprise(context, data)
  const result: GraphicalSchemaField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importGraphicalSchemaFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaFieldTypedEnterprise | GraphicalSchemaFieldPartialEnterprise | undefined
): Omit<Partial<GraphicalSchemaField>, "elementType" | "name"> => {
  const result: Omit<Partial<GraphicalSchemaField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(
    context,
    data.Вывод,
    SE.UseOutputFromEnterprise
  )
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const edit = importBooleanFromEnterprise(context, data.Редактирование)
  if (edit !== undefined) result.edit = edit

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "GraphicalSchemaField", importGraphicalSchemaFieldPropsFromEnterprise)
