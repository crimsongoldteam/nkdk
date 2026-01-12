import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupPropsFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { importTableFromEnterprise } from "~/metadata/forms/elements/table/importFromEnterprise"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupTypedEnterprise,
} from "~/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importUsualGroupTypedFromEnterprise = (
  context: ConfigurationContext,
  data: UsualGroupTypedEnterprise | undefined,
  name: string
): UsualGroup | undefined => {
  if (data === undefined) return undefined

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importUsualGroupPropsFromEnterprise(context, data, name)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: UsualGroup = {
    ...baseProps,
    ...props,
    elementType,
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importUsualGroupPartialFromEnterprise = (
  context: ConfigurationContext,
  source: UsualGroup | undefined,
  data: UsualGroupPartialEnterprise | undefined
): UsualGroup | undefined => {
  if (source === undefined) return undefined

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importUsualGroupPropsFromEnterprise(context, data, source.name)
  const result: UsualGroup = {
    ...source,
    ...baseProps,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importUsualGroupPropsFromEnterprise = (
  context: ConfigurationContext,
  data: UsualGroupTypedEnterprise | UsualGroupPartialEnterprise | undefined,
  name: string
): Omit<Partial<UsualGroup>, "elementType" | "name"> => {
  const result: Omit<Partial<UsualGroup>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const groupVerticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеВыравниваниеГруппы,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (groupVerticalAlign !== undefined) result.groupVerticalAlign = groupVerticalAlign

  const verticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const childItemsVerticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеПодчиненных,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const verticalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    data.ВертикальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromEnterprise<SE.ItemsAndTitlesAlignVariant>(
    context,
    data.ВыравниваниеЭлементовИЗаголовков,
    SE.ItemsAndTitlesAlignVariantFromEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  const groupHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеВыравниваниеГруппы,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (groupHorizontalAlign !== undefined) result.groupHorizontalAlign = groupHorizontalAlign

  const childItemsHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеПодчиненных,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const horizontalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    data.ГоризонтальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const group = importSystemEnumerationFromEnterprise<SE.ChildFormItemsGroup>(
    context,
    data.Группировка,
    SE.ChildFormItemsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  if (data.ЗаголовокСвернутогоОтображения !== undefined)
    result.collapsedRepresentationTitle = data.ЗаголовокСвернутогоОтображения

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const associatedTable = importTableFromEnterprise(context, data.ИспользуемаяТаблица, name + ".ИспользуемаяТаблица")
  if (associatedTable !== undefined) result.associatedTable = associatedTable

  const united = importBooleanFromEnterprise(context, data.Объединенная)
  if (united !== undefined) result.united = united

  const showTitle = importBooleanFromEnterprise(context, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const showLeftMargin = importBooleanFromEnterprise(context, data.ОтображатьОтступСлева)
  if (showLeftMargin !== undefined) result.showLeftMargin = showLeftMargin

  const representation = importSystemEnumerationFromEnterprise<SE.UsualGroupRepresentation>(
    context,
    data.Отображение,
    SE.UsualGroupRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const controlRepresentation = importSystemEnumerationFromEnterprise<SE.UsualGroupControlRepresentation>(
    context,
    data.ОтображениеУправления,
    SE.UsualGroupControlRepresentationFromEnterprise
  )
  if (controlRepresentation !== undefined) result.controlRepresentation = controlRepresentation

  const behavior = importSystemEnumerationFromEnterprise<SE.UsualGroupBehavior>(
    context,
    data.Поведение,
    SE.UsualGroupBehaviorFromEnterprise
  )
  if (behavior !== undefined) result.behavior = behavior

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

  if (data.ПутьКДаннымЗаголовка !== undefined) result.titleDataPath = data.ПутьКДаннымЗаголовка

  const throughAlign = importSystemEnumerationFromEnterprise<SE.ThroughAlign>(
    context,
    data.СквозноеВыравнивание,
    SE.ThroughAlignFromEnterprise
  )
  if (throughAlign !== undefined) result.throughAlign = throughAlign

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format !== undefined) result.format = format

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const hiddenRepresentationTitleBackColor = importColorFromEnterprise(
    context,
    data.ЦветФонаЗаголовкаСкрытогоОтображения
  )
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.hiddenRepresentationTitleBackColor = hiddenRepresentationTitleBackColor

  const slaveItemsWidth = importSystemEnumerationFromEnterprise<SE.ChildFormItemsWidth>(
    context,
    data.ШиринаПодчиненныхЭлементов,
    SE.ChildFormItemsWidthFromEnterprise
  )
  if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  return result
}

registerMetadata("ImportFromEnterprise", "UsualGroup", importUsualGroupPropsFromEnterprise)
