import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportTypedChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

type SearchControlAdditionCommonFields = Omit<SearchControlAddition, "elementType" | "name">

export const exportSingleSearchControlAdditionToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SingleSearchControlAddition | undefined
): SingleSearchControlAdditionEnterprise | undefined => {
  if (!data) return undefined

  const result = exportSearchControlAdditionCommonFieldsToEnterprise(context, undefined, data)

  if (Object.keys(result).length === 0) return undefined

  return result
}

export const exportSearchControlAdditionPartialToEnterprise = <From extends SearchControlAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (!data) return undefined as ToPartialEnterpriseType<From>

  const props = exportSearchControlAdditionCommonFieldsToEnterprise(context, undefined, data)

  const result = {
    ...props,
  }

  if (data.additionSource !== undefined) result.Источник = data.additionSource

  if (Object.keys(result).length === 0) return undefined as ToPartialEnterpriseType<From>

  return result as ToPartialEnterpriseType<From>
}

const exportSearchControlAdditionCommonFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SearchControlAdditionCommonFields
): SearchControlAdditionEnterprise => {
  const result: SearchControlAdditionEnterprise = {}

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const childItems = exportTypedChildItemsToEnterprise(context, undefined, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const extendedToolTip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedToolTip !== undefined) result.РасширеннаяПодсказка = extendedToolTip

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "SearchControlAddition",
  exportSearchControlAdditionPartialToEnterprise as ExportPartialToEnterpriseFn
)
