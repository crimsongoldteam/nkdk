import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportExtendedTooltipToEnterprise } from "~/metadata/forms/elements/extendedTooltip/exportToEnterprise"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupTypedEnterprise,
} from "~/metadata/forms/elements/usualGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportPartialChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"

export const exportUsualGroupTypedToEnterprise = <From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportUsualGroupPropsToEnterprise(context, data)

  const result: UsualGroupTypedEnterprise = {
    Тип: "Группа",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  const childItems = exportPartialChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportUsualGroupPartialToEnterprise = <From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportUsualGroupPropsToEnterprise(context, data)

  const result: UsualGroupPartialEnterprise = {
    ...props,
  }

  let title: I8nTextEnterprise | undefined
  if (data.showTitle == false) {
    title = exportI8nTextToEnterprise(context, data.title)
  } else {
    title = exportI8nTextOtherToEnterprise(context, data.title)
  }
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportUsualGroupPropsToEnterprise = (
  context: ConfigurationContext,
  data: UsualGroup
): UsualGroupPartialEnterprise => {
  const result: UsualGroupPartialEnterprise = {}

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  // const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormGroupTypeToEnterprise)
  // if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const enableContentChange = exportBooleanToEnterprise(context, data.enableContentChange)
  if (enableContentChange !== undefined) result.РазрешитьИзменениеСостава = enableContentChange

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  // const groupVerticalAlign = exportSystemEnumerationToEnterprise(
  //   context,
  //   data.groupVerticalAlign,
  //   SE.ItemVerticalAlignToEnterprise
  // )
  // if (groupVerticalAlign !== undefined) result.ВертикальноеВыравниваниеГруппы = groupVerticalAlign

  // const verticalAlign = exportSystemEnumerationToEnterprise(
  //   context,
  //   data.verticalAlign,
  //   SE.ItemVerticalAlignToEnterprise
  // )
  // if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

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

  // const groupHorizontalAlign = exportSystemEnumerationToEnterprise(
  //   context,
  //   data.groupHorizontalAlign,
  //   SE.ItemHorizontalLocationToEnterprise
  // )
  // if (groupHorizontalAlign !== undefined) result.ГоризонтальноеВыравниваниеГруппы = groupHorizontalAlign

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

  const collapsedRepresentationTitle = exportI8nTextToEnterprise(context, data.collapsedRepresentationTitle)
  if (collapsedRepresentationTitle !== undefined) result.ЗаголовокСвернутогоОтображения = collapsedRepresentationTitle
  const currentRowUse = exportSystemEnumerationToEnterprise(context, data.currentRowUse, SE.CurrentRowUseToEnterprise)
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  if (data.table !== undefined) result.Таблица = data.table

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

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
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

  // const slaveItemsWidth = exportSystemEnumerationToEnterprise(
  //   context,
  //   data.slaveItemsWidth,
  //   SE.ChildFormItemsWidthToEnterprise
  // )
  // if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "UsualGroup",
  exportUsualGroupPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "UsualGroup",
  exportUsualGroupTypedToEnterprise as ExportTypedToEnterpriseFn
)
