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
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importCommandBarChildItemsTypedFromEnterprise } from "../../collections/commandBarChildItems/importFromEnterprise"

export function importPopupTypedFromEnterprise<To extends Popup | undefined>(
  context: ConfigurationContext,
  enterprise: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (enterprise === undefined) return undefined as To

  const props = importPopupPropsFromEnterprise(context, enterprise)

  const result: Popup = {
    ...props,
    elementType: "Popup",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, enterprise.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPopupPartialFromEnterprise<To extends Popup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPopupPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPopupPropsFromEnterprise = (
  context: ConfigurationContext,
  enterprise: PopupTypedEnterprise | PopupPartialEnterprise | undefined
): Omit<Partial<Popup>, "elementType" | "name"> => {
  const result: Omit<Partial<Popup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (enterprise === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    enterprise.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    enterprise.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, enterprise.Видимость)
  if (visible !== undefined) result.visible = visible

  if (enterprise.Высота !== undefined) result.height = enterprise.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    enterprise.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, enterprise.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    enterprise.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, enterprise.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    enterprise.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    enterprise.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const enableContentChange = importBooleanFromEnterprise(context, enterprise.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, enterprise.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, enterprise.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (enterprise.СочетаниеКлавиш !== undefined) result.shortcut = enterprise.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, enterprise.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, enterprise.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (enterprise.Ширина !== undefined) result.width = enterprise.Ширина

  const titleFont = importFontFromEnterprise(context, enterprise.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, enterprise.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const picture = importPictureFromEnterprise(context, enterprise.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonRepresentation>(
    context,
    enterprise.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shapeRepresentation = importSystemEnumerationFromEnterprise<SE.ButtonShapeRepresentation>(
    context,
    enterprise.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

  const shape = importSystemEnumerationFromEnterprise<SE.ButtonShape>(
    context,
    enterprise.Фигура,
    SE.ButtonShapeFromEnterprise
  )
  if (shape !== undefined) result.shape = shape

  const borderColor = importColorFromEnterprise(context, enterprise.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, enterprise.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const childItems = importCommandBarChildItemsTypedFromEnterprise(context, enterprise.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Popup",
  importPopupPropsFromEnterprise as ImportPartialFromEnterpriseFn
)
