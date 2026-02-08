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
import { Page, PagePartialEnterprise, PageTypedEnterprise } from "~/metadata/forms/elements/page/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"

export function importPageTypedFromEnterprise<To extends Page | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importPagePropsFromEnterprise(context, undefined, data)

  const result: Page = {
    ...props,
    elementType: "Page",
    name,
    childItems: [],
  }

  const title = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPagePartialFromEnterprise<To extends Page>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPagePropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    elementType: "Page",
    childItems: source.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importPagePropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: PageTypedEnterprise | PagePartialEnterprise | undefined
): Omit<Partial<Page>, "elementType" | "name"> => {
  const result: Omit<Partial<Page>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const childItemsHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеПодчиненных,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const childItemsVerticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеПодчиненных,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const format = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Формат)
  if (format !== undefined) result.format = format

  const group = importSystemEnumerationFromEnterprise<SE.ChildFormItemsGroup>(
    context,
    undefined,
    data.Группировка,
    SE.ChildFormItemsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const horizontalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    undefined,
    data.ГоризонтальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromEnterprise<SE.ItemsAndTitlesAlignVariant>(
    context,
    undefined,
    data.ВыравниваниеЭлементовИЗаголовков,
    SE.ItemsAndTitlesAlignVariantFromEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  const picture = importPictureFromEnterprise(context, undefined, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const scrollOnCompress = importBooleanFromEnterprise(context, undefined, data.СкроллПриСжатии)
  if (scrollOnCompress !== undefined) result.scrollOnCompress = scrollOnCompress

  const showTitle = importBooleanFromEnterprise(context, undefined, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const slaveItemsWidth = importSystemEnumerationFromEnterprise<SE.ChildFormItemsWidth>(
    context,
    undefined,
    data.ШиринаПодчиненныхЭлементов,
    SE.ChildFormItemsWidthFromEnterprise
  )
  if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  if (data.ПутьКДаннымЗаголовка !== undefined) result.titleDataPath = data.ПутьКДаннымЗаголовка

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const verticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalScrollOnReduceSize = importBooleanFromEnterprise(
    context,
    undefined,
    data.ВертикальнаяПрокруткаПриСжатии
  )
  if (verticalScrollOnReduceSize !== undefined) result.verticalScrollOnReduceSize = verticalScrollOnReduceSize

  const verticalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    undefined,
    data.ВертикальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    undefined,
    data.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, undefined, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Page",
  importPagePartialFromEnterprise as ImportPartialFromEnterpriseFn
)
