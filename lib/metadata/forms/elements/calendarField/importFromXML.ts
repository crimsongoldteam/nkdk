import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importBorderFromXML from "~/lib/metadata/forms/border/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TCalendarFieldXML, TCalendarField } from "./types"


export const importCalendarFieldFromXML = (xml: TCalendarFieldXML | undefined): TCalendarField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
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