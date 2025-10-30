import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importBorderFromXML from "~/lib/metadata/forms/border/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPeriodFieldXML, TPeriodField } from "./types"


export const importPeriodFieldFromXML = (xml: TPeriodFieldXML | undefined): TPeriodField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     height: xml.Height,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     border: importBorderFromXML(xml.Border),
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     borderColor: importColorFromXML(xml.BorderColor),
     width: xml.Width,
     font: importFontFromXML(xml.Font),
  }
}