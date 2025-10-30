import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import importBorderFromXML from "~/lib/metadata/forms/border/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPictureFieldXML, TPictureField } from "./types"


export const importPictureFieldFromXML = (xml: TPictureFieldXML | undefined): TPictureField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     height: xml.Height,
     hyperlink: xml.Hyperlink,
     valuesPicture: xml.ValuesPicture,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     scale: xml.Scale,
     zoomable: xml.Zoomable,
     currentFrameNumber: xml.CurrentFrameNumber,
     pictureSize: xml.PictureSize,
     enableStartDrag: xml.EnableStartDrag,
     enableDrag: xml.EnableDrag,
     border: importBorderFromXML(xml.Border),
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     fileDragMode: xml.FileDragMode,
     nonselectedPictureText: xml.NonselectedPictureText,
     borderColor: importColorFromXML(xml.BorderColor),
     textColor: importColorFromXML(xml.TextColor),
     width: xml.Width,
     font: importFontFromXML(xml.Font),
  }
}