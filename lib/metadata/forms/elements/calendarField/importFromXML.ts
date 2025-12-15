import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importCalendarFieldFromXML = (xml: CalendarFieldXML | undefined): CalendarField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.CalendarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    beginOfRepresentationPeriod: xml.BeginOfRepresentationPeriod,
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    calendarNavigation: xml.CalendarNavigation,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    endOfRepresentationPeriod: xml.EndOfRepresentationPeriod,
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    heightInMonths: xml.HeightInMonths,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    selectionMode: xml.SelectionMode,
    showCurrentDate: xml.ShowCurrentDate,
    showMonthsPanel: xml.ShowMonthsPanel,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    widthInMonths: xml.WidthInMonths,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.CalendarField, importCalendarFieldFromXML)
