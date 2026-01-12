import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { Button, ButtonEnterprise, ButtonPropsEnterprise } from "~/metadata/forms/elements/button/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

export const importButtonChildFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonEnterprise,
  name: string
): Button => {
  const props = importButtonPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: Button = {
    ...props,
    elementType,
    name,
  }

  return result
}

export const importButtonFromEnterprise = (
  context: ConfigurationContext,
  source: Button | undefined,
  data: ButtonPropsEnterprise | undefined
): Button | undefined => {
  if (source === undefined) return undefined

  const props = importButtonPropsFromEnterprise(context, data)
  const result: Button = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importButtonPropsFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonPropsEnterprise | undefined
): Omit<Partial<Button>, "elementType"> => {
  const result: Omit<Partial<Button>, "elementType"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.ИмяКоманды !== undefined) result.commandName = data.ИмяКоманды

  const commandUniqueness = importBooleanFromEnterprise(context, data.УникальностьКоманды)
  if (commandUniqueness !== undefined) result.commandUniqueness = commandUniqueness

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  const defaultButton = importBooleanFromEnterprise(context, data.КнопкаПоУмолчанию)
  if (defaultButton !== undefined) result.defaultButton = defaultButton

  const defaultItem = importBooleanFromEnterprise(context, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const locationInCommandBar = importSystemEnumerationFromEnterprise<SE.ButtonLocationInCommandBar>(
    context,
    data.ПоложениеВКоманднойПанели,
    SE.ButtonLocationInCommandBarFromEnterprise
  )
  if (locationInCommandBar !== undefined) result.locationInCommandBar = locationInCommandBar

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const onlyInAllActions = importBooleanFromEnterprise(context, data.ТолькоВоВсехДействиях)
  if (onlyInAllActions !== undefined) result.onlyInAllActions = onlyInAllActions

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const pictureLocation = importSystemEnumerationFromEnterprise<SE.FormButtonPictureLocation>(
    context,
    data.ПоложениеКартинки,
    SE.FormButtonPictureLocationFromEnterprise
  )
  if (pictureLocation !== undefined) result.pictureLocation = pictureLocation

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonRepresentation>(
    context,
    data.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shape = importSystemEnumerationFromEnterprise<SE.ButtonShape>(
    context,
    data.Фигура,
    SE.ButtonShapeFromEnterprise
  )
  if (shape !== undefined) result.shape = shape

  const shapeRepresentation = importSystemEnumerationFromEnterprise<SE.ButtonShapeRepresentation>(
    context,
    data.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const skipOnInput = importBooleanFromEnterprise(context, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const type = importSystemEnumerationFromEnterprise<SE.FormButtonType>(
    context,
    data.Вид,
    SE.FormButtonTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

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

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Ширина !== undefined) result.width = data.Ширина

  return result
}

registerMetadata("ImportFromEnterprise", "Button", importButtonChildFromEnterprise)
