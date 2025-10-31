import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TCalendarFieldXML, TCalendarField } from "./types"

export const exportCalendarFieldToXML = (data: TCalendarField | undefined): TCalendarFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HeightInMonths: data.heightInMonths,
    EndOfRepresentationPeriod: data.endOfRepresentationPeriod,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    BeginOfRepresentationPeriod: data.beginOfRepresentationPeriod,
    ShowMonthsPanel: data.showMonthsPanel,
    ShowCurrentDate: data.showCurrentDate,
    CalendarNavigation: data.calendarNavigation,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    Border: exportBorderToXML(data.border),
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    SelectionMode: data.selectionMode,
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
    WidthInMonths: data.widthInMonths,
    Font: exportFontToXML(data.font),
  }
}