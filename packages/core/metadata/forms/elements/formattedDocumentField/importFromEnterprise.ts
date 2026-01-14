import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/formattedDocumentField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function importFormattedDocumentFieldTypedFromEnterprise<To extends FormattedDocumentField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importFormattedDocumentFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: FormattedDocumentField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as To
}

export function importFormattedDocumentFieldPartialFromEnterprise<To extends FormattedDocumentField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importFormattedDocumentFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importFormattedDocumentFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: FormattedDocumentFieldTypedEnterprise | FormattedDocumentFieldPartialEnterprise | undefined
): Omit<Partial<FormattedDocumentField>, "elementType" | "name"> => {
  const result: Omit<Partial<FormattedDocumentField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
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

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "FormattedDocumentField",
  importFormattedDocumentFieldPropsFromEnterprise
)
