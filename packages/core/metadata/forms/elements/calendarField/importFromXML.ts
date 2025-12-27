import { importBorderFromXML } from "~/packages/core/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/packages/core/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { CalendarField, CalendarFieldXML } from "~/packages/core/metadata/forms/elements/calendarField/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importCalendarFieldFromXML = (
  context: Context,
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
