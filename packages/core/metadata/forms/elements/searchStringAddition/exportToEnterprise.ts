import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

type SearchStringAdditionCommonFields = Omit<SearchStringAddition, "elementType" | "name">

export const exportSingleSearchStringAdditionToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SingleSearchStringAddition | undefined
): SingleSearchStringAdditionEnterprise | undefined => {
  if (!data) return undefined

  const result = exportSearchStringAdditionCommonFieldsToEnterprise(context, undefined, data)

  if (Object.keys(result).length === 0) return undefined

  return result
}

export const exportSearchStringAdditionPartialToEnterprise = <From extends SearchStringAddition | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (!data) return undefined as ToPartialEnterpriseType<From>

  const props = exportSearchStringAdditionCommonFieldsToEnterprise(context, undefined, data)

  if (Object.keys(props).length === 0) return undefined as ToPartialEnterpriseType<From>

  return props as ToPartialEnterpriseType<From>
}

const exportSearchStringAdditionCommonFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: SearchStringAdditionCommonFields
): SearchStringAdditionEnterprise => {
  const result: SearchStringAdditionEnterprise = {}

  const displayImportance = exportSystemEnumerationToYAML<SE.DisplayImportanceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DisplayImportance" },
    data.displayImportance
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlignInGroup
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const horizontalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlignInGroup
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

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

  const extendedToolTip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedToolTip !== undefined) result.РасширеннаяПодсказка = extendedToolTip

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

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
  "SearchStringAddition",
  exportSearchStringAdditionPartialToEnterprise as ExportPartialToEnterpriseFn
)
