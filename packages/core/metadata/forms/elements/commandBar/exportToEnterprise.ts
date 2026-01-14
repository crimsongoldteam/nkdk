import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
} from "~/metadata/forms/elements/commandBar/types"
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
import { exportButtonGroupChildItemsToEnterprise } from "../../collections/buttonGroupChildItems/exportToEnterprise"
import { exportBaseElementToEnterprise } from "../baseElement/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export const exportCommandBarTypedToEnterprise = <From extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportCommandBarPropsToEnterprise(context, data)

  const result: CommandBarTypedEnterprise = {
    Тип: "КоманднаяПанель",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportCommandBarPartialToEnterprise = <From extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportCommandBarPropsToEnterprise(context, data)

  const result: CommandBarPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCommandBarPropsToEnterprise = (
  context: ConfigurationContext,
  data: CommandBar
): CommandBarPartialEnterprise => {
  const baseFields = exportBaseElementToEnterprise(context, data)

  const result: CommandBarPartialEnterprise = {
    ...baseFields,
  }

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormGroupTypeToEnterprise)
  if (type !== undefined) result.Вид = type

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

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const autofill = exportBooleanToEnterprise(context, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const childItems = exportButtonGroupChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CommandBar",
  exportCommandBarPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "CommandBar",
  exportCommandBarTypedToEnterprise as ExportTypedToEnterpriseFn
)
