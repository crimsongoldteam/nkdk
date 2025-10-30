import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TProgressBarFieldXML, TProgressBarField } from "./types"


export const importProgressBarFieldFromXML = (xml: TProgressBarFieldXML | undefined): TProgressBarField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     height: xml.Height,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     maxValue: xml.MaxValue,
     minValue: xml.MinValue,
     orientation: xml.Orientation,
     showPercent: xml.ShowPercent,
     representation: xml.Representation,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     borderColor: importColorFromXML(xml.BorderColor),
     width: xml.Width,
  }
}