import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TGanttChartFieldXML, TGanttChartField } from "./types"


export const importGanttChartFieldFromXML = (xml: TGanttChartFieldXML | undefined): TGanttChartField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     verticalLines: xml.VerticalLines,
     selectedValues: xml.SelectedValues,
     selectedIntervals: xml.SelectedIntervals,
     height: xml.Height,
     horizontalLines: xml.HorizontalLines,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     tableLocation: xml.TableLocation,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     valuesSelectionMode: xml.ValuesSelectionMode,
     intervalsSelectionMode: xml.IntervalsSelectionMode,
     currentValue: xml.CurrentValue,
     currentInterval: xml.CurrentInterval,
     width: xml.Width,
  }
}