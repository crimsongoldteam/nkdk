import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { exportTableToEnterprise } from "~/metadata/forms/elements/table/exportToEnterprise"
import { UsualGroup, UsualGroupEnterprise } from "~/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportUsualGroupToEnterprise = (
  context: ConfigurationContext,
  data: UsualGroup | undefined
): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToEnterprise(context, data)
  if (!baseFields) return undefined

  const result: UsualGroupEnterprise = {
    ...baseFields,
  }

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const groupVerticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.groupVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (groupVerticalAlign !== undefined) result.ВертикальноеВыравниваниеГруппы = groupVerticalAlign

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

  const groupHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.groupHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (groupHorizontalAlign !== undefined) result.ГоризонтальноеВыравниваниеГруппы = groupHorizontalAlign

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

  if (data.collapsedRepresentationTitle !== undefined)
    result.ЗаголовокСвернутогоОтображения = data.collapsedRepresentationTitle

  const currentRowUse = exportSystemEnumerationToEnterprise(context, data.currentRowUse, SE.CurrentRowUseToEnterprise)
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const associatedTable = exportTableToEnterprise(context, data.associatedTable)
  if (associatedTable !== undefined) result.ИспользуемаяТаблица = associatedTable

  const united = exportBooleanToEnterprise(context, data.united)
  if (united !== undefined) result.Объединенная = united

  const showTitle = exportBooleanToEnterprise(context, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  const showLeftMargin = exportBooleanToEnterprise(context, data.showLeftMargin)
  if (showLeftMargin !== undefined) result.ОтображатьОтступСлева = showLeftMargin

  const representation = exportSystemEnumerationToEnterprise(
    context,
    data.representation,
    SE.UsualGroupRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const controlRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.controlRepresentation,
    SE.UsualGroupControlRepresentationToEnterprise
  )
  if (controlRepresentation !== undefined) result.ОтображениеУправления = controlRepresentation

  const behavior = exportSystemEnumerationToEnterprise(context, data.behavior, SE.UsualGroupBehaviorToEnterprise)
  if (behavior !== undefined) result.Поведение = behavior

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  if (data.titleDataPath !== undefined) result.ПутьКДаннымЗаголовка = data.titleDataPath

  const throughAlign = exportSystemEnumerationToEnterprise(context, data.throughAlign, SE.ThroughAlignToEnterprise)
  if (throughAlign !== undefined) result.СквозноеВыравнивание = throughAlign

  const format = exportI8nTextToEnterprise(context, data.format)
  if (format !== undefined) result.Формат = format

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const hiddenRepresentationTitleBackColor = exportColorToEnterprise(context, data.hiddenRepresentationTitleBackColor)
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.ЦветФонаЗаголовкаСкрытогоОтображения = hiddenRepresentationTitleBackColor

  const slaveItemsWidth = exportSystemEnumerationToEnterprise(
    context,
    data.slaveItemsWidth,
    SE.ChildFormItemsWidthToEnterprise
  )
  if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  return result
}

registerMetadata("ExportToEnterprise", "UsualGroup", exportUsualGroupToEnterprise)
