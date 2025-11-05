import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPictureDecorationToXML = (data: TPictureDecoration | undefined): TPictureDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportFormDecorationToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Hyperlink: data.hyperlink,
    NonselectedPictureText: data.nonselectedPictureText,
    Picture: exportPictureToXML(data.picture),
    PictureSize: data.pictureSize,
    Scale: data.scale,
    Zoomable: data.zoomable,
    Events: data.events ? {
       Click: data.events.click,
       DragStart: data.events.dragStart,
       DragEnd: data.events.dragEnd,
       Drag: data.events.drag,
       DragCheck: data.events.dragCheck,
    } : undefined,
  }
}

registerExport(ZElementType.enum.PictureDecoration, exportPictureDecorationToXML)