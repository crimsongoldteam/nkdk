import { importFormFieldFromXML } from "../formField/importFromXML"
import { TChartFieldXML, TChartField } from "./types"

export const importChartFieldFromXML = (xml: TChartFieldXML | undefined): TChartField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    width: xml.Width,
  }
}