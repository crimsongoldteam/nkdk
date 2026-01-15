import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
} from "~/metadata/forms/elements/labelField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
export function importLabelFieldTypedFromEnterprise<To extends LabelField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importLabelFieldPropsFromEnterprise(context, data)

  const result: LabelField = {
    ...props,
    elementType: "LabelField",
    name,
  }
  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importLabelFieldPartialFromEnterprise<To extends LabelField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importLabelFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    elementType: "LabelField",
    name: source.name,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importLabelFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: LabelFieldTypedEnterprise | LabelFieldPartialEnterprise | undefined
): Omit<Partial<LabelField>, "elementType" | "name"> => {
  const result: Omit<Partial<LabelField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "LabelField", importLabelFieldPropsFromEnterprise)
