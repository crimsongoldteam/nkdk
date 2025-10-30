import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importTypeDescriptionFromXML from "~/lib/metadata/typeDescription/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TFormFieldXML, TFormField } from "./types"


export const importPictureDecorationFromXML = (xml: TPictureDecorationXML | undefined): TPictureDecoration | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     hyperlink: xml.Hyperlink,
     picture: importPictureFromXML(xml.Picture),
     scale: xml.Scale,
     zoomable: xml.Zoomable,
     pictureSize: xml.PictureSize,
     enableStartDrag: xml.EnableStartDrag,
     enableDrag: xml.EnableDrag,
     border: xml.Border,
     fileDragMode: xml.FileDragMode,
     nonselectedPictureText: xml.NonselectedPictureText,
     borderColor: importColorFromXML(xml.BorderColor),
  }
}