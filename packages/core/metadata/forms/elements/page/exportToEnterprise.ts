import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportExtendedTooltipToEnterprise } from "~/metadata/forms/elements/extendedTooltip/exportToEnterprise"
import { Page, PagePartialEnterprise, PageTypedEnterprise } from "~/metadata/forms/elements/page/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"

export function exportPageTypedToEnterprise<From extends Page | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportPagePropsToEnterprise(context, undefined, data)

  const result: PageTypedEnterprise = {
    Тип: "Страница",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportPagePartialToEnterprise<From extends Page | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportPagePropsToEnterprise(context, undefined, data)

  const result: PagePartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

export const exportPagePropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Page
): PagePartialEnterprise => {
  const result: PagePartialEnterprise = {}

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML(context, undefined, data.type, SE.FormGroupTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToEnterprise(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableContentChange = exportBooleanToEnterprise(context, undefined, data.enableContentChange)
  if (enableContentChange !== undefined) result.РазрешитьИзменениеСостава = enableContentChange

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalScrollOnReduceSize = exportBooleanToEnterprise(context, undefined, data.verticalScrollOnReduceSize)
  if (verticalScrollOnReduceSize !== undefined) result.ВертикальнаяПрокруткаПриСжатии = verticalScrollOnReduceSize

  const verticalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const childItemsVerticalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.childItemsVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.ВертикальноеПоложениеПодчиненных = childItemsVerticalAlign

  const verticalSpacing = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (verticalSpacing !== undefined) result.ВертикальныйИнтервал = verticalSpacing

  const itemsAndTitlesAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.itemsAndTitlesAlign,
    SE.ItemsAndTitlesAlignVariantToEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.ВыравниваниеЭлементовИЗаголовков = itemsAndTitlesAlign

  const childItemsHorizontalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.childItemsHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеПодчиненных = childItemsHorizontalAlign

  const horizontalSpacing = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (horizontalSpacing !== undefined) result.ГоризонтальныйИнтервал = horizontalSpacing

  const group = exportSystemEnumerationToYAML(context, undefined, data.group, SE.ChildFormItemsGroupToEnterprise)
  if (group !== undefined) result.Группировка = group

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const showTitle = exportBooleanToEnterprise(context, undefined, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  if (data.titleDataPath !== undefined) result.ПутьКДаннымЗаголовка = data.titleDataPath

  const scrollOnCompress = exportBooleanToEnterprise(context, undefined, data.scrollOnCompress)
  if (scrollOnCompress !== undefined) result.СкроллПриСжатии = scrollOnCompress

  const format = exportI8nTextToEnterprise(context, undefined, data.format)
  if (format !== undefined) result.Формат = format

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const slaveItemsWidth = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.slaveItemsWidth,
    SE.ChildFormItemsWidthToEnterprise
  )
  if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  return result
}

registerMetadata("ExportPartialToEnterprise", "Page", exportPagePartialToEnterprise as ExportPartialToEnterpriseFn)
registerMetadata("ExportTypedToEnterprise", "Page", exportPageTypedToEnterprise as ExportTypedToEnterpriseFn)
