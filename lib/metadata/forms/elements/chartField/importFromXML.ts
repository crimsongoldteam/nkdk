import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TChartFieldXML, TChartField } from "./types"


export const importChartFieldFromXML = (xml: TChartFieldXML | undefined): TChartField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
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