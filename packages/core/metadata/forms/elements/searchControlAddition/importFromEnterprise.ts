import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsTypedFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { isHasContent } from "./helper"

export const importSearchControlAdditionPartialFromEnterprise = <To extends SearchControlAddition>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To => {
  const props = importSearchControlAdditionPropsFromEnterprise(context, undefined, data)

  const result: To = {
    ...source,
    ...props,
    elementType: source.elementType,
    name: source.name,
  }

  if (data?.Источник !== undefined) {
    result.additionSource = data.Источник
  }

  return result
}

export const importSingleSearchControlAdditionFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SingleSearchControlAdditionEnterprise | undefined
): SingleSearchControlAddition | undefined => {
  const props = importSearchControlAdditionPropsFromEnterprise(context, undefined, data)
  if (props === undefined) return undefined

  return props
}

export const importSearchControlAdditionPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SearchControlAdditionEnterprise | undefined
): SingleSearchControlAddition | undefined => {
  if (!data) return undefined

  const result: SingleSearchControlAddition = {
    elementType: "SearchControlAddition",
    childItems: [],
  }

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

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

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

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const title = importI8nTextFromEnterprise(context, undefined, data.Заголовок)
  if (title !== undefined) result.title = title

  result.childItems = importChildItemsTypedFromEnterprise(context, undefined, data.ПодчиненныеЭлементы)

  const extendedToolTip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  if (!isHasContent(result)) return undefined

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "SearchControlAddition",
  importSearchControlAdditionPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
