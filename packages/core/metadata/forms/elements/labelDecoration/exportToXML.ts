import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportFormattedI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/formattedI8nText/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { LabelDecoration, LabelDecorationXML } from "~/metadata/forms/elements/labelDecoration/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuDeprecatedToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToDeprecatedXML } from "../extendedTooltip/exportToXML"

export function exportLabelDecorationToXML<From extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: LabelDecorationXML = {
    ...baseFields,
    ContextMenu: exportContextMenuDeprecatedToXML(context, undefined, data.contextMenu, data),
    ExtendedTooltip: exportExtendedTooltipToDeprecatedXML(context, undefined, data.extendedTooltip, data),
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const backColor = exportColorToXML(context, undefined, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToXML(context, undefined, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  const events = exportEventsToXML(context, undefined, data.events)
  if (events !== undefined) result.Events = events

  const font = exportFontToXML(context, undefined, data.font)
  if (font !== undefined) result.Font = font

  // if (data.groupVerticalAlign !== undefined) result.GroupVerticalAlign = data.groupVerticalAlign

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.hyperlink !== undefined) result.Hyperlink = data.hyperlink

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const textColor = exportColorToXML(context, undefined, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const title = exportFormattedI8nTextToXMLWithDefaultLanguage(context, undefined, data.title)
  if (title !== undefined) result.Title = title

  if (data.titleHeight !== undefined) result.TitleHeight = data.titleHeight

  const toolTip = exportI8nTextToXML(context, { type: "I8nText" }, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "LabelDecoration", exportLabelDecorationToXML as ExportToXMLFn)
