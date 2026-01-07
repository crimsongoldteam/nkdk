import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/metadata/forms/elements/calendarField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportCalendarFieldToXML = (
  context: ConfigurationContext,
  data: CalendarField | undefined
): CalendarFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: CalendarFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.beginOfRepresentationPeriod !== undefined)
    result.BeginOfRepresentationPeriod = data.beginOfRepresentationPeriod

  const border = exportBorderToXML(context, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.calendarNavigation !== undefined) result.CalendarNavigation = data.calendarNavigation

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.endOfRepresentationPeriod !== undefined) result.EndOfRepresentationPeriod = data.endOfRepresentationPeriod

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.height !== undefined) result.Height = data.height

  if (data.heightInMonths !== undefined) result.HeightInMonths = data.heightInMonths

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.selectionMode !== undefined) result.SelectionMode = data.selectionMode

  if (data.showCurrentDate !== undefined) result.ShowCurrentDate = data.showCurrentDate

  if (data.showMonthsPanel !== undefined) result.ShowMonthsPanel = data.showMonthsPanel

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  if (data.widthInMonths !== undefined) result.WidthInMonths = data.widthInMonths

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return result
}

registerMetadata("ExportToXML", "CalendarField", exportCalendarFieldToXML)
