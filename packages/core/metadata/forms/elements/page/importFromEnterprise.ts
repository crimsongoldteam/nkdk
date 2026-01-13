import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupPropsFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { Page, PageEnterprise } from "~/metadata/forms/elements/page/types"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPageFromEnterprise = <From extends PageEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, Page, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, Page, Name>

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importPagePropsFromEnterprise(context, data)

  const result: Page = {
    ...baseProps,
    ...props,
    elementType: FormElementType.Page,
    name,
    childItems: [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as ImportFromEnterpriseReturn<From, Page, Name>
}

const importPagePropsFromEnterprise = (
  context: ConfigurationContext,
  data: PageEnterprise
): Omit<Partial<Page>, "elementType" | "name"> => {
  const result: Omit<Partial<Page>, "elementType" | "name"> = {
    childItems: [],
  }

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const childItemsHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеПодчиненных,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const childItemsVerticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеПодчиненных,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format !== undefined) result.format = format

  const group = importSystemEnumerationFromEnterprise<SE.ChildFormItemsGroup>(
    context,
    data.Группировка,
    SE.ChildFormItemsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const horizontalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    data.ГоризонтальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromEnterprise<SE.ItemsAndTitlesAlignVariant>(
    context,
    data.ВыравниваниеЭлементовИЗаголовков,
    SE.ItemsAndTitlesAlignVariantFromEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const scrollOnCompress = importBooleanFromEnterprise(context, data.СкроллПриСжатии)
  if (scrollOnCompress !== undefined) result.scrollOnCompress = scrollOnCompress

  const showTitle = importBooleanFromEnterprise(context, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const slaveItemsWidth = importSystemEnumerationFromEnterprise<SE.ChildFormItemsWidth>(
    context,
    data.ШиринаПодчиненныхЭлементов,
    SE.ChildFormItemsWidthFromEnterprise
  )
  if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  if (data.ПутьКДаннымЗаголовка !== undefined) result.titleDataPath = data.ПутьКДаннымЗаголовка

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

  const verticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalScrollOnReduceSize = importBooleanFromEnterprise(context, data.ВертикальнаяПрокруткаПриСжатии)
  if (verticalScrollOnReduceSize !== undefined) result.verticalScrollOnReduceSize = verticalScrollOnReduceSize

  const verticalSpacing = importSystemEnumerationFromEnterprise<SE.FormItemSpacing>(
    context,
    data.ВертикальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  return result
}

registerMetadata("ImportPartialFromEnterprise", "Page", importPageFromEnterprise)
