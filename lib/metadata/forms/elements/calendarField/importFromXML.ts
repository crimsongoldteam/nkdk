import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/lib/metadata/forms/elements/calendarField/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importCalendarFieldFromXML = (
  configurationSettings: Context,
  xml: CalendarFieldXML | undefined
): CalendarField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.CalendarField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    beginOfRepresentationPeriod: xml.BeginOfRepresentationPeriod,
    border: importBorderFromXML(configurationSettings, xml.Border),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    calendarNavigation: xml.CalendarNavigation,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    endOfRepresentationPeriod: xml.EndOfRepresentationPeriod,
    font: importFontFromXML(configurationSettings, xml.Font),
    height: xml.Height,
    heightInMonths: xml.HeightInMonths,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    selectionMode: xml.SelectionMode,
    showCurrentDate: xml.ShowCurrentDate,
    showMonthsPanel: xml.ShowMonthsPanel,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    widthInMonths: xml.WidthInMonths,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML)
