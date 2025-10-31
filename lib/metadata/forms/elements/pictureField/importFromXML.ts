import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPictureFieldXML, TPictureField } from "./types"

export const importPictureFieldFromXML = (xml: TPictureFieldXML | undefined): TPictureField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    hyperlink: xml.Hyperlink,
    valuesPicture: xml.ValuesPicture,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    scale: xml.Scale,
    zoomable: xml.Zoomable,
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