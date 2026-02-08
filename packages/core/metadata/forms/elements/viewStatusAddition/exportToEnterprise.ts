import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
} from "~/metadata/forms/elements/viewStatusAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "./rules"

type ViewStatusAdditionCommonFields = Omit<ViewStatusAddition, "elementType" | "name">

export const exportViewStatusAdditionPartialToEnterprise = <From extends ViewStatusAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (!data) return undefined as ToPartialEnterpriseType<From>

  const props = exportViewStatusAdditionCommonFieldsToEnterprise(context, undefined, data)

  if (Object.keys(props).length === 0) return undefined as ToPartialEnterpriseType<From>

  return props as ToPartialEnterpriseType<From>
}

const exportViewStatusAdditionCommonFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: ViewStatusAdditionCommonFields
): ViewStatusAdditionEnterprise => {
  const result: ViewStatusAdditionEnterprise = {}

  const displayImportance = exportSystemEnumerationToYAML<SE.DisplayImportanceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DisplayImportance" },
    data.displayImportance
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const horizontalAlign = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlign
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const border = exportBorderToEnterprise(context, undefined, data.border)
  if (border !== undefined) result.Рамка = border

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const buttonsBackColor = exportColorToEnterprise(context, undefined, data.buttonsBackColor)
  if (buttonsBackColor !== undefined) result.ЦветФонаКнопок = buttonsBackColor

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToYAML<SE.ToolTipRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ToolTipRepresentation" },
    data.toolTipRepresentation
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  if (data.width !== undefined) result.Ширина = data.width

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "ViewStatusAddition",
  exportViewStatusAdditionPartialToEnterprise as ExportPartialToEnterpriseFn
)
