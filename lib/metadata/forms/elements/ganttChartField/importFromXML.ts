import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importGanttChartFieldFromXML = (xml: GanttChartFieldXML | undefined): GanttChartField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.GanttChartField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalLines: xml.HorizontalLines,
    horizontalStretch: xml.HorizontalStretch,
    intervalsSelectionMode: xml.IntervalsSelectionMode,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    tableLocation: xml.TableLocation,
    valuesSelectionMode: xml.ValuesSelectionMode,
    verticalLines: xml.VerticalLines,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.GanttChartField, importGanttChartFieldFromXML)
