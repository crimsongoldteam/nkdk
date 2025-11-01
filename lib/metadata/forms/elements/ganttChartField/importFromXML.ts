import { importFormFieldFromXML } from "../formField/importFromXML"
import { TGanttChartFieldXML, TGanttChartField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importGanttChartFieldFromXML = (xml: TGanttChartFieldXML | undefined): TGanttChartField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.GanttChartField,
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
  }
}

registerImport(ZElementType.enum.GanttChartField, importGanttChartFieldFromXML)