import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { FormDecoration, FormDecorationXML } from "~/metadata/forms/elements/formDecoration/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { ImportExportReturn } from "../types"

export const exportFormDecorationToXML = <T extends FormDecoration | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, FormDecorationXML> => {
  if (!data) return undefined as ImportExportReturn<T, FormDecorationXML>

  const baseFields = exportElementPropsToXML(context, data)

  const result: FormDecorationXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const contextMenu = exportContextMenuToXML(context, data.contextMenu, data)
  if (contextMenu !== undefined) result.ContextMenu = contextMenu

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  result.ExtendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ImportExportReturn<T, FormDecorationXML>
}

registerMetadata<FormDecoration>("ExportToXML", "FormDecoration", exportFormDecorationToXML)
