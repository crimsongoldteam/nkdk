import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportFormattedI8nTextToEnterprise } from "~/metadata/commonObjects/formattedI8nText/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"

export function exportExtendedTooltipToEnterprise<T extends ExtendedTooltip | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: T
): ExtendedTooltipEnterprise | undefined {
  if (!data) return undefined

  const result: ExtendedTooltipEnterprise = {}

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

  const title = exportFormattedI8nTextToEnterprise(
    context,
    undefined,
    data.title,
    "Заголовок",
    "ФорматированныйЗаголовок"
  )
  Object.assign(result, title)

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
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

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  return Object.keys(result).length > 0 ? result : undefined
}

registerTypeRule("ExtendedTooltip", "exportToEnterprise", exportExtendedTooltipToEnterprise)
