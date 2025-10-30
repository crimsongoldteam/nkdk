import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TTextDocumentFieldXML, TTextDocumentField } from "./types"


export const importTextDocumentFieldFromXML = (xml: TTextDocumentFieldXML | undefined): TTextDocumentField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     output: xml.Output,
     selectedText: xml.SelectedText,
     height: xml.Height,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     borderColor: importColorFromXML(xml.BorderColor),
     textColor: importColorFromXML(xml.TextColor),
     backColor: importColorFromXML(xml.BackColor),
     width: xml.Width,
     font: importFontFromXML(xml.Font),
  }
}