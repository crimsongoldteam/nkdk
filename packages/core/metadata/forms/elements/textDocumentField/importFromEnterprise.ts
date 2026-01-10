import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { TextDocumentField, TextDocumentFieldEnterprise } from "~/metadata/forms/elements/textDocumentField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importTextDocumentFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    ПослеЗаписи?: string
  } | undefined
): {
  onChange?: string
  beforeWrite?: string
  beforePrint?: string
  afterWrite?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    beforeWrite?: string
    beforePrint?: string
    afterWrite?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.ПередЗаписью !== undefined) result.beforeWrite = data.ПередЗаписью
  if (data.ПередПечатью !== undefined) result.beforePrint = data.ПередПечатью
  if (data.ПослеЗаписи !== undefined) result.afterWrite = data.ПослеЗаписи

  return Object.keys(result).length > 0 ? result : undefined
}

export const importTextDocumentFieldFromEnterprise = <
  From extends TextDocumentFieldEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, TextDocumentField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, TextDocumentField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, TextDocumentField, Name> = {
    ...baseFields,
    elementType: FormElementType.TextDocumentField,
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

  if (data.ВыделенныйТекст !== undefined) result.selectedText = data.ВыделенныйТекст

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

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importTextDocumentFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "TextDocumentField", importTextDocumentFieldFromEnterprise)

