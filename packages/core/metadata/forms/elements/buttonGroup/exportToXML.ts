import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"

export function exportButtonGroupToXML<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, data)

  const childItems = exportChildItemsToXML(context, data.childItems)
  const extendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const result: ButtonGroupXML = {
    ...baseFields,
    ExtendedTooltip: extendedTooltip,
  }

  if (childItems !== undefined) result.ChildItems = childItems

  if (data.commandSource !== undefined) result.CommandSource = data.commandSource

  result.ExtendedTooltip = extendedTooltip

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXMLWithDefaultLanguage(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

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

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML as ExportToXMLFn)
