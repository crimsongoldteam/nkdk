import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TCalendarFieldXML, TCalendarField } from "./types"
import { ZElementType } from "../types"

export const importCalendarFieldFromXML = (xml: TCalendarFieldXML | undefined): TCalendarField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.CalendarField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    heightInMonths: xml.HeightInMonths,
    endOfRepresentationPeriod: xml.EndOfRepresentationPeriod,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    beginOfRepresentationPeriod: xml.BeginOfRepresentationPeriod,
    showMonthsPanel: xml.ShowMonthsPanel,
    showCurrentDate: xml.ShowCurrentDate,
    calendarNavigation: xml.CalendarNavigation,
    enableStartDrag: xml.EnableStartDrag,
    enableDrag: xml.EnableDrag,
    border: importBorderFromXML(xml.Border),
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    selectionMode: xml.SelectionMode,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
    widthInMonths: xml.WidthInMonths,
    font: importFontFromXML(xml.Font),
  }
}