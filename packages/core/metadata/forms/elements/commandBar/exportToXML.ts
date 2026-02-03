import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { PropertyRule } from "../calendarField/rules"

export function exportCommandBarToXML<From extends CommandBar | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: CommandBarXML = {
    ...baseFields,
  } as CommandBarXML

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.autofill !== undefined) result.Autofill = data.autofill

  const childItems = exportChildItemsToXML(context, undefined, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (data.commandSource !== undefined) result.CommandSource = data.commandSource

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  const extendedTooltip = exportExtendedTooltipToXML(context, undefined, data.extendedTooltip, data)
  if (extendedTooltip !== undefined) result.ExtendedTooltip = extendedTooltip

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlign !== undefined) result.HorizontalLocation = data.horizontalAlign

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXMLWithDefaultLanguage(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return result as ToXMLType<From>
}

registerMetadata("ExportToXML", "CommandBar", exportCommandBarToXML as ExportToXMLFn)
