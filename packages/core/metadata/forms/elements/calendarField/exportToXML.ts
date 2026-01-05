import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/metadata/forms/elements/calendarField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportCalendarFieldToXML = (
  context: Context,
  data: CalendarField | undefined
): CalendarFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BeginOfRepresentationPeriod: data.beginOfRepresentationPeriod,
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    CalendarNavigation: data.calendarNavigation,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    EndOfRepresentationPeriod: data.endOfRepresentationPeriod,
    Font: exportFontToXML(context, data.font),
    Height: data.height,
    HeightInMonths: data.heightInMonths,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    SelectionMode: data.selectionMode,
    ShowCurrentDate: data.showCurrentDate,
    ShowMonthsPanel: data.showMonthsPanel,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WidthInMonths: data.widthInMonths,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "CalendarField", exportCalendarFieldToXML)
