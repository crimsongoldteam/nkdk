import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { isHasContent } from "./helper"
import { PropertyRule } from "../calendarField/rules"

export const importSearchStringAdditionPartialFromEnterprise = <To extends SearchStringAddition>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To => {
  const props = importSearchStringAdditionPropsFromEnterprise(context, undefined, data)

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

export const importSingleSearchStringAdditionFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SingleSearchStringAdditionEnterprise | undefined
): SingleSearchStringAddition | undefined => {
  const props = importSearchStringAdditionPropsFromEnterprise(context, undefined, data)
  if (props === undefined) return undefined

  return props
}

export const importSearchStringAdditionPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: SearchStringAdditionEnterprise | undefined
): SingleSearchStringAddition | undefined => {
  if (!data) return undefined

  const result: SingleSearchStringAddition = {
    elementType: "SearchStringAddition",
  }

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
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
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const title = importI8nTextFromEnterprise(context, undefined, data.Заголовок)
  if (title !== undefined) result.title = title

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const extendedToolTip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

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
  "SearchStringAddition",
  importSearchStringAdditionPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
