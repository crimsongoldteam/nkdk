import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import importBorderFromXML from "~/lib/metadata/forms/border/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"


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
     border: importBorderFromXML(xml.Border),
     fileDragMode: xml.FileDragMode,
     nonselectedPictureText: xml.NonselectedPictureText,
     borderColor: importColorFromXML(xml.BorderColor),
  }
}