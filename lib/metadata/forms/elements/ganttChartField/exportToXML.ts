import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGanttChartFieldXML, TGanttChartField } from "./types"

export const exportGanttChartFieldToXML = (data: TGanttChartField | undefined): TGanttChartFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    VerticalLines: data.verticalLines,
    Height: data.height,
    HorizontalLines: data.horizontalLines,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TableLocation: data.tableLocation,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ValuesSelectionMode: data.valuesSelectionMode,
    IntervalsSelectionMode: data.intervalsSelectionMode,
    Width: data.width,
  }
}