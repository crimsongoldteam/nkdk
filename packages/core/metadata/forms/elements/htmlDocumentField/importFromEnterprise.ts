import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { HTMLDocumentField, HTMLDocumentFieldEnterprise } from "~/metadata/forms/elements/htmlDocumentField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importHTMLDocumentFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    ДокументСформирован?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
    ПриНажатии?: string
  } | undefined
): {
  onChange?: string
  documentComplete?: string
  beforeWrite?: string
  beforePrint?: string
  afterWrite?: string
  onClick?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    documentComplete?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
    onClick?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.ДокументСформирован !== undefined) result.documentComplete = data.ДокументСформирован
  if (data.ПередЗаписью !== undefined) result.beforeWrite = data.ПередЗаписью
  if (data.ПередПечатью !== undefined) result.beforePrint = data.ПередПечатью
  if (data.ПослеЗаписи !== undefined) result.afterWrite = data.ПослеЗаписи
  if (data.ПриНажатии !== undefined) result.onClick = data.ПриНажатии

  return Object.keys(result).length > 0 ? result : undefined
}

export const importHTMLDocumentFieldFromEnterprise = <
  From extends HTMLDocumentFieldEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, HTMLDocumentField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, HTMLDocumentField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, HTMLDocumentField, Name> = {
    ...baseFields,
    elementType: FormElementType.HTMLDocumentField,
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

  if (data.ИнформацияПрограммыПросмотра !== undefined) result.userAgentInformation = data.ИнформацияПрограммыПросмотра

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

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importHTMLDocumentFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "HTMLDocumentField", importHTMLDocumentFieldFromEnterprise)
