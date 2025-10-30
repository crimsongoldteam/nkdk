import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPdfDocumentFieldXML, TPdfDocumentField } from "./types"


export const importPdfDocumentFieldFromXML = (xml: TPdfDocumentFieldXML | undefined): TPdfDocumentField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     output: xml.Output,
     height: xml.Height,
     usedFileName: xml.UsedFileName,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     scale: xml.Scale,
     currentPageNumber: xml.CurrentPageNumber,
     orientation: xml.Orientation,
     viewStatusLocation: xml.ViewStatusLocation,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     borderColor: importColorFromXML(xml.BorderColor),
     width: xml.Width,
  }
}