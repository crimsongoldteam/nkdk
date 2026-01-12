import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupPropsToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { Page, PagePartialEnterprise, PageTypedEnterprise } from "~/metadata/forms/elements/page/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPageTypedToEnterprise = (
  context: ConfigurationContext,
  data: Page | undefined
): PageTypedEnterprise | undefined => {
  if (!data) return undefined

  const props = exportPagePropsToEnterprise(context, data)

  const result: PageTypedEnterprise = {
    Тип: "Страница",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportPagePartialToEnterprise = (context: ConfigurationContext, data: Page): PagePartialEnterprise => {
  const props = exportPagePropsToEnterprise(context, data)

  const result: PagePartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportPagePropsToEnterprise = (context: ConfigurationContext, data: Page): PagePartialEnterprise => {
  const baseFields = exportFormGroupPropsToEnterprise(context, data)

  const result: PagePartialEnterprise = {
    ...baseFields,
  }

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalScrollOnReduceSize = exportBooleanToEnterprise(context, data.verticalScrollOnReduceSize)
  if (verticalScrollOnReduceSize !== undefined) result.ВертикальнаяПрокруткаПриСжатии = verticalScrollOnReduceSize

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const childItemsVerticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.childItemsVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.ВертикальноеПоложениеПодчиненных = childItemsVerticalAlign

  const verticalSpacing = exportSystemEnumerationToEnterprise(
    context,
    data.verticalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (verticalSpacing !== undefined) result.ВертикальныйИнтервал = verticalSpacing

  const itemsAndTitlesAlign = exportSystemEnumerationToEnterprise(
    context,
    data.itemsAndTitlesAlign,
    SE.ItemsAndTitlesAlignVariantToEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.ВыравниваниеЭлементовИЗаголовков = itemsAndTitlesAlign

  const childItemsHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.childItemsHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеПодчиненных = childItemsHorizontalAlign

  const horizontalSpacing = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (horizontalSpacing !== undefined) result.ГоризонтальныйИнтервал = horizontalSpacing

  const group = exportSystemEnumerationToEnterprise(context, data.group, SE.ChildFormItemsGroupToEnterprise)
  if (group !== undefined) result.Группировка = group

  const picture = exportPictureToEnterprise(context, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const showTitle = exportBooleanToEnterprise(context, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  if (data.titleDataPath !== undefined) result.ПутьКДаннымЗаголовка = data.titleDataPath

  const scrollOnCompress = exportBooleanToEnterprise(context, data.scrollOnCompress)
  if (scrollOnCompress !== undefined) result.СкроллПриСжатии = scrollOnCompress

  const format = exportI8nTextToEnterprise(context, data.format)
  if (format !== undefined) result.Формат = format

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const slaveItemsWidth = exportSystemEnumerationToEnterprise(
    context,
    data.slaveItemsWidth,
    SE.ChildFormItemsWidthToEnterprise
  )
  if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  return result
}

registerMetadata("ExportPartialToEnterprise", "Page", exportPagePartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "Page", exportPageTypedToEnterprise)
