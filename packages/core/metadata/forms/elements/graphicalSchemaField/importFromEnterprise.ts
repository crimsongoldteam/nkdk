import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { GraphicalSchemaField, GraphicalSchemaFieldEnterprise } from "~/metadata/forms/elements/graphicalSchemaField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importGraphicalSchemaFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Выбор?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриАктивизации?: string
  } | undefined
): {
  onChange?: string
  selection?: string
  beforeWrite?: string
  beforePrint?: string
  afterWrite?: string
  onActivate?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    selection?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
    onActivate?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.ПередЗаписью !== undefined) result.beforeWrite = data.ПередЗаписью
  if (data.ПередПечатью !== undefined) result.beforePrint = data.ПередПечатью
  if (data.ПослеЗаписи !== undefined) result.afterWrite = data.ПослеЗаписи
  if (data.ПриАктивизации !== undefined) result.onActivate = data.ПриАктивизации

  return Object.keys(result).length > 0 ? result : undefined
}

export const importGraphicalSchemaFieldFromEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaFieldEnterprise | undefined,
  name: string
): GraphicalSchemaField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: GraphicalSchemaField = {
    elementType: FormElementType.GraphicalSchemaField,
    ...restFields,
  }

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
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
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

  const events = importGraphicalSchemaFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "GraphicalSchemaField", importGraphicalSchemaFieldFromEnterprise)

