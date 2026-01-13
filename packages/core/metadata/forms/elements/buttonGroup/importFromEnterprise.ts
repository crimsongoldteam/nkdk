import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
} from "~/metadata/forms/elements/buttonGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importButtonGroupChildItemsFromEnterprise } from "../../collections/buttonGroupChildItems/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

export const importButtonGroupTypedFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupTypedEnterprise | undefined,
  name: string
): ButtonGroup | undefined => {
  if (data === undefined) return undefined

  const props = importButtonGroupPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: ButtonGroup = {
    ...props,
    elementType,
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importButtonGroupPartialFromEnterprise = (
  context: ConfigurationContext,
  source: ButtonGroup | undefined,
  data: ButtonGroupPartialEnterprise | undefined
): ButtonGroup | undefined => {
  if (source === undefined) return undefined

  const props = importButtonGroupPropsFromEnterprise(context, data)
  const result: ButtonGroup = {
    ...source,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importButtonGroupPropsFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupTypedEnterprise | ButtonGroupPartialEnterprise | undefined
): Omit<Partial<ButtonGroup>, "elementType" | "name"> => {
  const result: Omit<Partial<ButtonGroup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    data.Вид,
    SE.FormGroupTypeFromEnterprise
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

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonGroupRepresentation>(
    context,
    data.Отображение,
    SE.ButtonGroupRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

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

  const childItems = importButtonGroupChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  return result
}

registerMetadata("ImportPartialFromEnterprise", "ButtonGroup", importButtonGroupPropsFromEnterprise)
