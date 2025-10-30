import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TDendrogramFieldXML, TDendrogramField } from "./types"


export const importDendrogramFieldFromXML = (xml: TDendrogramFieldXML | undefined): TDendrogramField | undefined => {
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