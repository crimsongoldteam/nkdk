import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TGraphicalSchemaFieldXML, TGraphicalSchemaField } from "./types"


export const importGraphicalSchemaFieldFromXML = (xml: TGraphicalSchemaFieldXML | undefined): TGraphicalSchemaField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     output: xml.Output,
     height: xml.Height,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     edit: xml.Edit,
     currentItem: xml.CurrentItem,
     borderColor: importColorFromXML(xml.BorderColor),
     width: xml.Width,
  }
}