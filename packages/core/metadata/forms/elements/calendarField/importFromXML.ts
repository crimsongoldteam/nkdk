import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/metadata/forms/elements/calendarField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importCalendarFieldFromXML = (
  context: ConfigurationContext,
  xml: CalendarFieldXML | undefined
): CalendarField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.CalendarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    beginOfRepresentationPeriod: xml.BeginOfRepresentationPeriod,
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    calendarNavigation: xml.CalendarNavigation,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    endOfRepresentationPeriod: xml.EndOfRepresentationPeriod,
    font: importFontFromXML(context, xml.Font),
    height: xml.Height,
    heightInMonths: xml.HeightInMonths,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    selectionMode: xml.SelectionMode,
    showCurrentDate: xml.ShowCurrentDate,
    showMonthsPanel: xml.ShowMonthsPanel,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    widthInMonths: xml.WidthInMonths,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML)
