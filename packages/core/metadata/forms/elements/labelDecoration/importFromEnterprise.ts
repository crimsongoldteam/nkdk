import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importFormattedI8nTextCombinedFromEnterprise,
  importFormattedI8nTextFromEnterprise,
} from "~/metadata/commonObjects/formattedI8nText/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"

import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importContextMenuFromEnterprise } from "~/metadata/forms/elements/contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "~/metadata/forms/elements/extendedTooltip/importFromEnterprise"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "~/metadata/forms/elements/labelDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"

const importLabelDecorationEventsFromEnterprise = (
  data: { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } | undefined
) => {
  if (!data) return undefined

  const result: { click?: string; uRLProcessing?: string } = {}

  if (data.Нажатие !== undefined) {
    result.click = data.Нажатие
  }

  if (data.ОбработкаНавигационнойСсылки !== undefined) {
    result.uRLProcessing = data.ОбработкаНавигационнойСсылки
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export function importLabelDecorationTypedFromEnterprise<To extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importLabelDecorationPropsFromEnterprise(context, undefined, data)

  const result: LabelDecoration = {
    ...props,
    elementType: "LabelDecoration",
    name,
  }

  const title = importFormattedI8nTextFromEnterprise(context, undefined, data.Заголовок, data.ФорматированныйЗаголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importLabelDecorationPartialFromEnterprise<To extends LabelDecoration>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importLabelDecorationPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
  }

  const title = importFormattedI8nTextCombinedFromEnterprise(
    context,
    undefined,
    source.title,
    data?.Заголовок,
    data?.ФорматированныйЗаголовок
  )
  if (title !== undefined) result.title = title

  return result
}

const importLabelDecorationPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: LabelDecorationTypedEnterprise | LabelDecorationPartialEnterprise | undefined
): Omit<Partial<LabelDecoration>, "elementType" | "name"> => {
  const result: Omit<Partial<LabelDecoration>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromYAML<SE.FormDecorationType>(
    context,
    undefined,
    data.Вид,
    SE.FormDecorationTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  const groupVerticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеВыравниваниеГруппы,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (groupVerticalAlign !== undefined) result.groupVerticalAlign = groupVerticalAlign

  const verticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const hyperlink = importBooleanFromEnterprise(context, undefined, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

  const horizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const border = importBorderFromEnterprise(context, undefined, data.Рамка)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const events = importLabelDecorationEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "LabelDecoration",
  importLabelDecorationPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
registerMetadata(
  "ImportTypedFromEnterprise",
  "LabelDecoration",
  importLabelDecorationTypedFromEnterprise as ImportTypedFromEnterpriseFn
)
