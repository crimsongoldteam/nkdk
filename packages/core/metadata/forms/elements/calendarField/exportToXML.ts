import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { CalendarField, CalendarFieldXML } from "~/metadata/forms/elements/calendarField/types"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { PropertyRule } from "./rules"
export function exportCalendarFieldToXML<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: CalendarFieldXML = {
    ...baseFields,
    ContextMenu: exportContextMenuToXML(context, undefined, data.contextMenu, data),
    ExtendedTooltip: exportExtendedTooltipToXML(context, undefined, data.extendedTooltip, data),
  }

  if (data.autoCellHeight !== undefined) result.AutoCellHeight = data.autoCellHeight

  if (data.cellHyperlink !== undefined) result.CellHyperlink = data.cellHyperlink

  if (data.dataPath !== undefined) result.DataPath = data.dataPath

  if (data.defaultItem !== undefined) result.DefaultItem = data.defaultItem

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const title = exportI8nTextToXMLWithDefaultLanguage(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (data.titleHeight !== undefined) result.TitleHeight = data.titleHeight

  if (data.titleLocation !== undefined) result.TitleLocation = data.titleLocation

  const titleTextColor = exportColorToXML(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.visible !== undefined) result.Visible = data.visible

  const warningOnEdit = exportI8nTextToXML(context, undefined, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

  if (data.warningOnEditRepresentation !== undefined)
    result.WarningOnEditRepresentation = data.warningOnEditRepresentation

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.beginOfRepresentationPeriod !== undefined)
    result.BeginOfRepresentationPeriod = data.beginOfRepresentationPeriod

  const border = exportBorderToXML(context, undefined, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.calendarNavigation !== undefined) result.CalendarNavigation = data.calendarNavigation

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.endOfRepresentationPeriod !== undefined) result.EndOfRepresentationPeriod = data.endOfRepresentationPeriod

  const font = exportFontToXML(context, undefined, data.font)
  if (font !== undefined) result.Font = font

  if (data.height !== undefined) result.Height = data.height

  if (data.heightInMonths !== undefined) result.HeightInMonths = data.heightInMonths

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.onMainServerUnavalableBehavior !== undefined)
    result.OnMainServerUnavalableBehavior = data.onMainServerUnavalableBehavior

  if (data.selectionMode !== undefined) result.SelectionMode = data.selectionMode

  if (data.showCurrentDate !== undefined) result.ShowCurrentDate = data.showCurrentDate

  if (data.showMonthsPanel !== undefined) result.ShowMonthsPanel = data.showMonthsPanel

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  if (data.widthInMonths !== undefined) result.WidthInMonths = data.widthInMonths

  const events = exportEventsToXML(context, undefined, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "CalendarField", exportCalendarFieldToXML as ExportToXMLFn)
