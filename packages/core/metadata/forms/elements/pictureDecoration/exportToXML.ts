import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportFormattedI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/formattedI8nText/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PictureDecoration, PictureDecorationXML } from "~/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuToXML } from "../contextMenu/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"

export function exportPictureDecorationToXML<From extends PictureDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const contextMenu = exportContextMenuToXML(context, undefined, data.contextMenu, data)

  const extendedTooltip = exportExtendedTooltipToXML(context, undefined, data.extendedTooltip, data)
  const result: PictureDecorationXML = {
    ...baseFields,
    ContextMenu: contextMenu,
    ExtendedTooltip: extendedTooltip,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  const font = exportFontToXML(context, undefined, data.font)
  if (font !== undefined) result.Font = font

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const textColor = exportColorToXML(context, undefined, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const title = exportFormattedI8nTextToXMLWithDefaultLanguage(context, undefined, data.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  const border = exportBorderToXML(context, undefined, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.fileDragMode !== undefined) result.FileDragMode = data.fileDragMode

  if (data.hyperlink !== undefined) result.Hyperlink = data.hyperlink

  if (data.nonselectedPictureText !== undefined) result.NonselectedPictureText = data.nonselectedPictureText

  const picture = exportPictureToXML(context, undefined, data.picture)
  if (picture !== undefined) result.Picture = picture

  if (data.pictureSize !== undefined) result.PictureSize = data.pictureSize

  if (data.scale !== undefined) result.Scale = data.scale

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.zoomable !== undefined) result.Zoomable = data.zoomable

  const events = exportEventsToXML(context, undefined, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "PictureDecoration", exportPictureDecorationToXML as ExportToXMLFn)
