import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/metadata/forms/elements/calendarField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importCalendarFieldFromXML<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const result: CalendarField = {
    ...baseFields,
    elementType: FormElementType.CalendarField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.BeginOfRepresentationPeriod !== undefined) result.beginOfRepresentationPeriod = xml.BeginOfRepresentationPeriod

  const border = importBorderFromXML(context, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.CalendarNavigation !== undefined) result.calendarNavigation = xml.CalendarNavigation

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.EndOfRepresentationPeriod !== undefined) result.endOfRepresentationPeriod = xml.EndOfRepresentationPeriod

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HeightInMonths !== undefined) result.heightInMonths = xml.HeightInMonths

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.SelectionMode !== undefined) result.selectionMode = xml.SelectionMode

  if (xml.ShowCurrentDate !== undefined) result.showCurrentDate = xml.ShowCurrentDate

  if (xml.ShowMonthsPanel !== undefined) result.showMonthsPanel = xml.ShowMonthsPanel

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.WidthInMonths !== undefined) result.widthInMonths = xml.WidthInMonths

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML)
