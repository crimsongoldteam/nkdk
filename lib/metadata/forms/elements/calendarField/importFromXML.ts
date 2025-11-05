import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TCalendarFieldXML, TCalendarField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importCalendarFieldFromXML = (xml: TCalendarFieldXML | undefined): TCalendarField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.CalendarField,
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
    events: xml.Events ? {
       selection: xml.Events.Selection,
       dragStart: xml.Events.DragStart,
       dragEnd: xml.Events.DragEnd,
       drag: xml.Events.Drag,
       onActivateDate: xml.Events.OnActivateDate,
       onPeriodOutput: xml.Events.OnPeriodOutput,
       dragCheck: xml.Events.DragCheck,
    } : undefined,
  }
}

registerImport(ZElementType.enum.CalendarField, importCalendarFieldFromXML)