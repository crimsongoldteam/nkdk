import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"
import { ZElementType } from "../types"

export const importPictureDecorationFromXML = (xml: TPictureDecorationXML | undefined): TPictureDecoration | undefined => {
  if (!xml) return undefined

  const base = importFormDecorationFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.PictureDecoration,
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