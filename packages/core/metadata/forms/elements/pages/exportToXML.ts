import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToDeprecatedXML } from "../extendedTooltip/exportToXML"

export function exportPagesToXML<From extends Pages | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: PagesXML = {
    ...baseFields,
  } as PagesXML

  const childItems = exportChildItemsToXML(context, undefined, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (data.currentPagesState !== undefined) result.CurrentPagesState = data.currentPagesState

  if (data.currentRowUse !== undefined) result.CurrentRowUse = data.currentRowUse

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  result.ExtendedTooltip = exportExtendedTooltipToDeprecatedXML(context, undefined, data.extendedTooltip, data)

  const events = exportEventsToXML(context, undefined, data.events)
  if (events !== undefined) result.Events = events

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.pagesRepresentation !== undefined) result.PagesRepresentation = data.pagesRepresentation

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXMLWithDefaultLanguage(context, undefined, data.title)
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

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Pages", exportPagesToXML as ExportToXMLFn)
