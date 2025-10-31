import { importFormFieldFromXML } from "../formField/importFromXML"
import { TGanttChartFieldXML, TGanttChartField } from "./types"

export const importGanttChartFieldFromXML = (xml: TGanttChartFieldXML | undefined): TGanttChartField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    verticalLines: xml.VerticalLines,
    height: xml.Height,
    horizontalLines: xml.HorizontalLines,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    tableLocation: xml.TableLocation,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    valuesSelectionMode: xml.ValuesSelectionMode,
    intervalsSelectionMode: xml.IntervalsSelectionMode,
    width: xml.Width,
  }
}