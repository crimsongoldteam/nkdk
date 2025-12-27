import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { GanttChartField, GanttChartFieldXML } from "~/packages/core/metadata/forms/elements/ganttChartField/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importGanttChartFieldFromXML = (
  context: Context,
  xml: GanttChartFieldXML | undefined
): GanttChartField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
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
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    valuesSelectionMode: xml.ValuesSelectionMode,
    verticalLines: xml.VerticalLines,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "GanttChartField", importGanttChartFieldFromXML)
