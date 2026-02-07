import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ViewStatusAddition, ViewStatusAdditionEnterprise } from "~/metadata/forms/elements/viewStatusAddition/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

export const importViewStatusAdditionFromEnterprise = <From extends ViewStatusAdditionEnterprise | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): From extends undefined ? undefined : ViewStatusAddition => {
  if (!data) return undefined as From extends undefined ? undefined : ViewStatusAddition

  const result: ViewStatusAddition = {}

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const horizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const border = importBorderFromEnterprise(context, undefined, data.Рамка)
  if (border !== undefined) result.border = border

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const buttonsBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаКнопок)
  if (buttonsBackColor !== undefined) result.buttonsBackColor = buttonsBackColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
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

  const extendedToolTip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  return result as From extends undefined ? undefined : ViewStatusAddition
}
