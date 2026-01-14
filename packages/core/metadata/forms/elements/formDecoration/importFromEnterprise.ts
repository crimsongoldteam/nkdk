import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importContextMenuFromEnterprise } from "~/metadata/forms/elements/contextMenu/importFromEnterprise"
import { ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import {
  FormDecoration,
  FormDecorationPartialEnterprise,
  FormDecorationTypedEnterprise,
} from "~/metadata/forms/elements/formDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
export function importFormDecorationTypedFromEnterprise<To extends FormDecoration | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importFormDecorationPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: FormDecoration = {
    ...props,
    elementType,
    name,
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importFormDecorationPartialFromEnterprise<To extends FormDecoration>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importFormDecorationPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importFormDecorationPropsFromEnterprise = (
  context: ConfigurationContext,
  data: FormDecorationTypedEnterprise | FormDecorationPartialEnterprise | undefined
): Omit<Partial<FormDecoration>, "elementType" | "name"> => {
  const result: Omit<Partial<FormDecoration>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormDecorationType>(
    context,
    data.Вид,
    SE.FormDecorationTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const contextMenu = importContextMenuFromEnterprise(
    context,
    data.КонтекстноеМеню as ContextMenuEnterprise | undefined
  )
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

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

  const skipOnInput = importBooleanFromEnterprise(context, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  return result
}

registerMetadata("ImportPartialFromEnterprise", "FormDecoration", importFormDecorationPropsFromEnterprise)
