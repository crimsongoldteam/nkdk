import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField, LabelFieldEnterprise } from "~/metadata/forms/elements/labelField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

const importLabelFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  } | undefined
): {
  onChange?: string
  click?: string
  uRLProcessing?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    click?: string
    uRLProcessing?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Нажатие !== undefined) result.click = data.Нажатие
  if (data.ОбработкаНавигационнойСсылки !== undefined) result.uRLProcessing = data.ОбработкаНавигационнойСсылки

  return Object.keys(result).length > 0 ? result : undefined
}

export const importLabelFieldFromEnterprise = <
  From extends LabelFieldEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, LabelField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, LabelField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, LabelField, Name> = {
    ...baseFields,
    elementType: FormElementType.LabelField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const markNegatives = importBooleanFromEnterprise(context, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  if (data.Высота !== undefined) result.height = data.Высота

  const hyperlink = importBooleanFromEnterprise(context, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

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

  const border = importBorderFromEnterprise(context, data.Рамка)
  if (border !== undefined) result.border = border

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const passwordMode = importBooleanFromEnterprise(context, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format !== undefined) result.format = format

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importLabelFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "LabelField", importLabelFieldFromEnterprise)

