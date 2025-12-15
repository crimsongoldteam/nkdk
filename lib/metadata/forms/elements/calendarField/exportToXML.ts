import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportCalendarFieldToXML = (data: CalendarField | undefined): CalendarFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

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
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.CalendarField, exportCalendarFieldToXML)
