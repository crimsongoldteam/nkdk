import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "./rules"

export function importCalendarFieldFromXML<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importBaseElementFromXML(context, undefined, xml)

  const result: CalendarField = {
    ...baseFields,
    elementType: "CalendarField",
  }

  if (xml.AutoCellHeight !== undefined) result.autoCellHeight = xml.AutoCellHeight

  if (xml.CellHyperlink !== undefined) result.cellHyperlink = xml.CellHyperlink

  const contextMenu = importContextMenuFromXML(context, undefined, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml.DataPath !== undefined) result.dataPath = xml.DataPath

  if (xml.DefaultItem !== undefined) result.defaultItem = xml.DefaultItem

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedTooltip = importExtendedTooltipFromXML(context, undefined, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.GroupHorizontalAlign !== undefined) result.horizontalAlignInGroup = xml.GroupHorizontalAlign

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const title = importI8nTextFromXML(context, undefined, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, undefined, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  if (xml.TitleLocation !== undefined) result.titleLocation = xml.TitleLocation

  const titleTextColor = importColorFromXML(context, undefined, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, undefined, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  const userVisible = importUserVisibleFromXML(context, undefined, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.GroupVerticalAlign !== undefined) result.verticalAlignInGroup = xml.GroupVerticalAlign

  if (xml.Visible !== undefined) result.visible = xml.Visible

  const warningOnEdit = importI8nTextFromXML(context, undefined, xml.WarningOnEdit)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  if (xml.WarningOnEditRepresentation !== undefined)
    result.warningOnEditRepresentation = xml.WarningOnEditRepresentation

  const events = importEventsFromXML(context, undefined, xml.Events)
  if (events !== undefined) result.events = events

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.BeginOfRepresentationPeriod !== undefined)
    result.beginOfRepresentationPeriod = xml.BeginOfRepresentationPeriod

  const border = importBorderFromXML(context, undefined, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, undefined, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.CalendarNavigation !== undefined) result.calendarNavigation = xml.CalendarNavigation

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.EndOfRepresentationPeriod !== undefined) result.endOfRepresentationPeriod = xml.EndOfRepresentationPeriod

  const font = importFontFromXML(context, undefined, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.OnMainServerUnavalableBehavior !== undefined)
    result.onMainServerUnavalableBehavior = xml.OnMainServerUnavalableBehavior

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HeightInMonths !== undefined) result.heightInMonths = xml.HeightInMonths

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.SelectionMode !== undefined) result.selectionMode = xml.SelectionMode

  if (xml.ShowCurrentDate !== undefined) result.showCurrentDate = xml.ShowCurrentDate

  if (xml.ShowMonthsPanel !== undefined) result.showMonthsPanel = xml.ShowMonthsPanel

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.WidthInMonths !== undefined) result.widthInMonths = xml.WidthInMonths

  return result as To
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML as ImportFromXMLFn)
