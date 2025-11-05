import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPictureDecorationFromXML = (xml: TPictureDecorationXML | undefined): TPictureDecoration | undefined => {
  if (!xml) return undefined

  const base = importFormDecorationFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.PictureDecoration,
    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(xml.Picture),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    zoomable: xml.Zoomable,
    events: xml.Events ? {
       click: xml.Events.Click,
       dragStart: xml.Events.DragStart,
       dragEnd: xml.Events.DragEnd,
       drag: xml.Events.Drag,
       dragCheck: xml.Events.DragCheck,
    } : undefined,
  }
}

registerImport(ZElementType.enum.PictureDecoration, importPictureDecorationFromXML)