import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importExtendedTooltipFromEnterprise } from "~/metadata/forms/elements/extendedTooltip/importFromEnterprise"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupTypedEnterprise,
} from "~/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
export function importUsualGroupTypedFromEnterprise<To extends UsualGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importUsualGroupPropsFromEnterprise(context, undefined, data)

  const result: UsualGroup = {
    ...props,
    elementType: "UsualGroup",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, undefined, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importUsualGroupPartialFromEnterprise<To extends UsualGroup>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importUsualGroupPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    childItems: source.childItems,
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importUsualGroupPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsualGroupTypedEnterprise | UsualGroupPartialEnterprise | undefined
): Omit<Partial<UsualGroup>, "elementType" | "name"> => {
  const result: Omit<Partial<UsualGroup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  // const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
  //   context,
  //   data.Вид,
  //   SE.FormGroupTypeFromEnterprise
  // )
  // if (type !== undefined) result.type = type

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

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, undefined, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const childItemsVerticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеПодчиненных,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const verticalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    undefined,
    data.ВертикальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromYAML<SE.ItemsAndTitlesAlignVariant>(
    context,
    undefined,
    data.ВыравниваниеЭлементовИЗаголовков,
    SE.ItemsAndTitlesAlignVariantFromEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  const childItemsHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеПодчиненных,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const horizontalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    undefined,
    data.ГоризонтальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const group = importSystemEnumerationFromYAML<SE.ChildFormItemsGroup>(
    context,
    undefined,
    data.Группировка,
    SE.ChildFormItemsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const collapsedRepresentationTitle = importI8nTextFromEnterprise(
    context,
    undefined,
    data.ЗаголовокСвернутогоОтображения
  )
  if (collapsedRepresentationTitle !== undefined) result.collapsedRepresentationTitle = collapsedRepresentationTitle

  const currentRowUse = importSystemEnumerationFromYAML<SE.CurrentRowUse>(
    context,
    undefined,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  if (data.Таблица !== undefined) result.table = data.Таблица

  const united = importBooleanFromEnterprise(context, undefined, data.Объединенная)
  if (united !== undefined) result.united = united

  const showTitle = importBooleanFromEnterprise(context, undefined, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const showLeftMargin = importBooleanFromEnterprise(context, undefined, data.ОтображатьОтступСлева)
  if (showLeftMargin !== undefined) result.showLeftMargin = showLeftMargin

  const representation = importSystemEnumerationFromYAML<SE.UsualGroupRepresentation>(
    context,
    undefined,
    data.Отображение,
    SE.UsualGroupRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const controlRepresentation = importSystemEnumerationFromYAML<SE.UsualGroupControlRepresentation>(
    context,
    undefined,
    data.ОтображениеУправления,
    SE.UsualGroupControlRepresentationFromEnterprise
  )
  if (controlRepresentation !== undefined) result.controlRepresentation = controlRepresentation

  const behavior = importSystemEnumerationFromYAML<SE.UsualGroupBehavior>(
    context,
    undefined,
    data.Поведение,
    SE.UsualGroupBehaviorFromEnterprise
  )
  if (behavior !== undefined) result.behavior = behavior

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  if (data.ПутьКДаннымЗаголовка !== undefined) result.titleDataPath = data.ПутьКДаннымЗаголовка

  const throughAlign = importSystemEnumerationFromYAML<SE.ThroughAlign>(
    context,
    undefined,
    data.СквозноеВыравнивание,
    SE.ThroughAlignFromEnterprise
  )
  if (throughAlign !== undefined) result.throughAlign = throughAlign

  const format = importI8nTextFromEnterprise(context, undefined, data.Формат)
  if (format !== undefined) result.format = format

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const hiddenRepresentationTitleBackColor = importColorFromEnterprise(
    context,
    undefined,
    data.ЦветФонаЗаголовкаСкрытогоОтображения
  )
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.hiddenRepresentationTitleBackColor = hiddenRepresentationTitleBackColor

  // const slaveItemsWidth = importSystemEnumerationFromEnterprise<SE.ChildFormItemsWidth>(
  //   context,
  //   data.ШиринаПодчиненныхЭлементов,
  //   SE.ChildFormItemsWidthFromEnterprise
  // )
  // if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const collapsed = importBooleanFromEnterprise(context, undefined, data.Свернута)
  if (collapsed !== undefined) result.collapsed = collapsed

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "UsualGroup",
  importUsualGroupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
