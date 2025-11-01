import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TCalendarFieldXML, TCalendarField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportCalendarFieldToXML = (data: TCalendarField | undefined): TCalendarFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BeginOfRepresentationPeriod: data.beginOfRepresentationPeriod,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    CalendarNavigation: data.calendarNavigation,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    EndOfRepresentationPeriod: data.endOfRepresentationPeriod,
    Font: exportFontToXML(data.font),
    Height: data.height,
    HeightInMonths: data.heightInMonths,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    SelectionMode: data.selectionMode,
    ShowCurrentDate: data.showCurrentDate,
    ShowMonthsPanel: data.showMonthsPanel,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WidthInMonths: data.widthInMonths,
  }
}

registerExport(ZElementType.enum.CalendarField, exportCalendarFieldToXML)