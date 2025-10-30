import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { THtmlDocumentFieldXML, THtmlDocumentField } from "./types"


export const importHtmlDocumentFieldFromXML = (xml: THtmlDocumentFieldXML | undefined): THtmlDocumentField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     output: xml.Output,
     height: xml.Height,
     userAgentInformation: xml.UserAgentInformation,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     borderColor: importColorFromXML(xml.BorderColor),
     width: xml.Width,
  }
}