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
import { Button, ButtonPartialEnterprise } from "~/metadata/forms/elements/button/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importButtonTypedFromEnterprise<To extends Button | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importButtonPropsFromEnterprise(context, undefined, data)

  const result: Button = {
    ...props,
    elementType: "Button",
    name,
  }

  return result as To
}

export function importButtonPartialFromEnterprise<To extends Button>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importButtonPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importButtonPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ButtonPartialEnterprise | undefined
): Partial<Button> | undefined => {
  const result: Omit<Partial<Button>, "elementType"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.ИмяКоманды !== undefined) result.commandName = data.ИмяКоманды

  const commandUniqueness = importBooleanFromEnterprise(context, undefined, data.УникальностьКоманды)
  if (commandUniqueness !== undefined) result.commandUniqueness = commandUniqueness

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  const defaultButton = importBooleanFromEnterprise(context, undefined, data.КнопкаПоУмолчанию)
  if (defaultButton !== undefined) result.defaultButton = defaultButton

  const defaultItem = importBooleanFromEnterprise(context, undefined, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const locationInCommandBar = importSystemEnumerationFromYAML<SE.ButtonLocationInCommandBar>(
    context,
    data.ПоложениеВКоманднойПанели,
    SE.ButtonLocationInCommandBarFromEnterprise
  )
  if (locationInCommandBar !== undefined) result.locationInCommandBar = locationInCommandBar

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const onlyInAllActions = importBooleanFromEnterprise(context, undefined, data.ТолькоВоВсехДействиях)
  if (onlyInAllActions !== undefined) result.onlyInAllActions = onlyInAllActions

  const picture = importPictureFromEnterprise(context, undefined, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const pictureLocation = importSystemEnumerationFromYAML<SE.FormButtonPictureLocation>(
    context,
    data.ПоложениеКартинки,
    SE.FormButtonPictureLocationFromEnterprise
  )
  if (pictureLocation !== undefined) result.pictureLocation = pictureLocation

  const representation = importSystemEnumerationFromYAML<SE.ButtonRepresentation>(
    context,
    data.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shape = importSystemEnumerationFromYAML<SE.ButtonShape>(context, data.Фигура, SE.ButtonShapeFromEnterprise)
  if (shape !== undefined) result.shape = shape

  const shapeRepresentation = importSystemEnumerationFromYAML<SE.ButtonShapeRepresentation>(
    context,
    data.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const title = importI8nTextFromEnterprise(context, undefined, data.Заголовок)
  if (title !== undefined) result.title = title

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const type = importSystemEnumerationFromYAML<SE.FormButtonType>(context, data.Вид, SE.FormButtonTypeFromEnterprise)
  if (type !== undefined) result.type = type

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Ширина !== undefined) result.width = data.Ширина

  return result as Partial<Button> | undefined
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Button",
  importButtonPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
registerMetadata("ImportTypedFromEnterprise", "Button", importButtonTypedFromEnterprise as ImportTypedFromEnterpriseFn)
