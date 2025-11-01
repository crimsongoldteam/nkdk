import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGanttChartFieldXML, TGanttChartField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportGanttChartFieldToXML = (data: TGanttChartField | undefined): TGanttChartFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalLines: data.horizontalLines,
    HorizontalStretch: data.horizontalStretch,
    IntervalsSelectionMode: data.intervalsSelectionMode,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TableLocation: data.tableLocation,
    ValuesSelectionMode: data.valuesSelectionMode,
    VerticalLines: data.verticalLines,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }
}

registerExport(ZElementType.enum.GanttChartField, exportGanttChartFieldToXML)