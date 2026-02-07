import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportFormattedI8nTextOtherToEnterprise,
  exportFormattedI8nTextToEnterprise,
} from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "~/metadata/forms/elements/labelDecoration/types"
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
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

const exportLabelDecorationEventsToEnterprise = (
  data: { click?: string; uRLProcessing?: string } | undefined
): { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } | undefined => {
  if (!data) return undefined

  const result: { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } = {}

  if (data.click !== undefined) {
    result.Нажатие = data.click
  }

  if (data.uRLProcessing !== undefined) {
    result.ОбработкаНавигационнойСсылки = data.uRLProcessing
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportLabelDecorationTypedToEnterprise = <From extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportLabelDecorationPropsToEnterprise(context, undefined, data)

  const result: LabelDecorationTypedEnterprise = {
    Тип: "Надпись",
    ...props,
  }

  const title = exportFormattedI8nTextToEnterprise(
    context,
    undefined,
    data.title,
    "Заголовок",
    "ФорматированныйЗаголовок"
  )
  Object.assign(result, title)

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportLabelDecorationPartialToEnterprise = <From extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: LabelDecoration
): ToPartialEnterpriseType<From> => {
  const props = exportLabelDecorationPropsToEnterprise(context, undefined, data)

  const result: LabelDecorationPartialEnterprise = {
    ...props,
  }

  const title = exportFormattedI8nTextOtherToEnterprise(
    context,
    undefined,
    data.title,
    "Заголовок",
    "ФорматированныйЗаголовок"
  )
  Object.assign(result, title)

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportLabelDecorationPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: LabelDecoration
): LabelDecorationPartialEnterprise => {
  const result: LabelDecorationPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

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

  const type = exportSystemEnumerationToEnterprise(context, undefined, data.type, SE.FormDecorationTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

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

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  const verticalAlignGroup = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.groupVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignGroup !== undefined) result.ВертикальноеВыравниваниеГруппы = verticalAlignGroup

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const hyperlink = exportBooleanToEnterprise(context, undefined, data.hyperlink)
  if (hyperlink !== undefined) result.Гиперссылка = hyperlink

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const border = exportBorderToEnterprise(context, undefined, data.border)
  if (border !== undefined) result.Рамка = border

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const events = exportLabelDecorationEventsToEnterprise(data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "LabelDecoration",
  exportLabelDecorationPartialToEnterprise as ExportPartialToEnterpriseFn
)

registerMetadata(
  "ExportTypedToEnterprise",
  "LabelDecoration",
  exportLabelDecorationTypedToEnterprise as ExportTypedToEnterpriseFn
)
