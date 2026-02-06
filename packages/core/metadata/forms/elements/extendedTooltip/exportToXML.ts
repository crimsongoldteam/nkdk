import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportFormattedI8nTextToXML } from "~/metadata/commonObjects/formattedI8nText/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { getExtendedTooltipName } from "./helper"

/** @deprecated */
export const exportExtendedTooltipToDeprecatedXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ExtendedTooltip | undefined,
  parentElement: { name: string }
): ExtendedTooltipXML => {
  const extendendTooltip = data ?? {}

  const baseFields = exportElementPropsToXML(context, undefined, {
    name: getExtendedTooltipName(parentElement),
  })

  const result: ExtendedTooltipXML = {
    ...baseFields,
  }

  if (extendendTooltip.autoMaxHeight !== undefined) result.AutoMaxHeight = extendendTooltip.autoMaxHeight

  if (extendendTooltip.autoMaxWidth !== undefined) result.AutoMaxWidth = extendendTooltip.autoMaxWidth

  if (extendendTooltip.displayImportance !== undefined) result._DisplayImportance = extendendTooltip.displayImportance

  if (extendendTooltip.enabled !== undefined) result.Enabled = extendendTooltip.enabled

  const font = exportFontToXML(context, undefined, extendendTooltip.font)
  if (font !== undefined) result.Font = font

  if (extendendTooltip.height !== undefined) result.Height = extendendTooltip.height

  if (extendendTooltip.horizontalAlignInGroup !== undefined)
    result.GroupHorizontalAlign = extendendTooltip.horizontalAlignInGroup

  if (extendendTooltip.horizontalStretch !== undefined) result.HorizontalStretch = extendendTooltip.horizontalStretch

  if (extendendTooltip.maxHeight !== undefined) result.MaxHeight = extendendTooltip.maxHeight

  if (extendendTooltip.maxWidth !== undefined) result.MaxWidth = extendendTooltip.maxWidth

  if (extendendTooltip.shortcut !== undefined) result.Shortcut = extendendTooltip.shortcut

  if (extendendTooltip.skipOnInput !== undefined) result.SkipOnInput = extendendTooltip.skipOnInput

  const textColor = exportColorToXML(context, undefined, extendendTooltip.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const title = exportFormattedI8nTextToXML(context, undefined, extendendTooltip.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, undefined, extendendTooltip.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (extendendTooltip.toolTipRepresentation !== undefined)
    result.ToolTipRepresentation = extendendTooltip.toolTipRepresentation

  if (extendendTooltip.type !== undefined) result.Type = extendendTooltip.type

  const userVisible = exportUserVisibleToXML(context, undefined, extendendTooltip.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (extendendTooltip.verticalAlignInGroup !== undefined)
    result.GroupVerticalAlign = extendendTooltip.verticalAlignInGroup

  if (extendendTooltip.verticalStretch !== undefined) result.VerticalStretch = extendendTooltip.verticalStretch

  if (extendendTooltip.visible !== undefined) result.Visible = extendendTooltip.visible

  if (extendendTooltip.width !== undefined) result.Width = extendendTooltip.width

  return sortObject(result)
}

export function exportExtendedTooltipToXML(
  context: Required<ConfigurationContext>,
  rule: PropertyRule,
  data: ExtendedTooltip | undefined
): ExtendedTooltipXML {
  const parentElement = context.elementContext
  return exportExtendedTooltipToDeprecatedXML(context, rule, data, parentElement)
}

registerTypeRule("ExtendedTooltip", "exportToXML", exportExtendedTooltipToXML as any)
