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
import { importExtendedTooltipFromEnterprise } from "~/metadata/forms/elements/extendedTooltip/importFromEnterprise"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsTypedFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importPopupTypedFromEnterprise<To extends Popup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  enterprise: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (enterprise === undefined) return undefined as To

  const props = importPopupPropsFromEnterprise(context, undefined, enterprise)

  const result: Popup = {
    ...props,
    elementType: "Popup",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, undefined, enterprise.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPopupPartialFromEnterprise<To extends Popup>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPopupPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPopupPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  enterprise: PopupTypedEnterprise | PopupPartialEnterprise | undefined
): Omit<Partial<Popup>, "elementType" | "name"> => {
  const result: Omit<Partial<Popup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (enterprise === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    undefined,
    enterprise.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    undefined,
    enterprise.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, enterprise.Видимость)
  if (visible !== undefined) result.visible = visible

  if (enterprise.Высота !== undefined) result.height = enterprise.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    undefined,
    enterprise.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, undefined, enterprise.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    undefined,
    enterprise.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, enterprise.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    enterprise.РазрешитьИспользование,
    enterprise.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const enableContentChange = importBooleanFromEnterprise(context, undefined, enterprise.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, undefined, enterprise.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, enterprise.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (enterprise.СочетаниеКлавиш !== undefined) result.shortcut = enterprise.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, undefined, enterprise.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, undefined, enterprise.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (enterprise.Ширина !== undefined) result.width = enterprise.Ширина

  const titleFont = importFontFromEnterprise(context, undefined, enterprise.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, enterprise.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const picture = importPictureFromEnterprise(context, undefined, enterprise.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonRepresentation>(
    context,
    undefined,
    enterprise.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shapeRepresentation = importSystemEnumerationFromEnterprise<SE.ButtonShapeRepresentation>(
    context,
    undefined,
    enterprise.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

  const shape = importSystemEnumerationFromEnterprise<SE.ButtonShape>(
    context,
    undefined,
    enterprise.Фигура,
    SE.ButtonShapeFromEnterprise
  )
  if (shape !== undefined) result.shape = shape

  const borderColor = importColorFromEnterprise(context, undefined, enterprise.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, undefined, enterprise.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  result.childItems = importChildItemsTypedFromEnterprise(context, undefined, enterprise.ПодчиненныеЭлементы)

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Popup",
  importPopupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
registerMetadata("ImportTypedFromEnterprise", "Popup", importPopupTypedFromEnterprise as ImportTypedFromEnterpriseFn)
