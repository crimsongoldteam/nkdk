import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"

export const exportPictureDecorationToXML = (data: TPictureDecoration | undefined): TPictureDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportFormDecorationToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    Hyperlink: data.hyperlink,
    Picture: exportPictureToXML(data.picture),
    Scale: data.scale,
    Zoomable: data.zoomable,
    PictureSize: data.pictureSize,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    Border: exportBorderToXML(data.border),
    FileDragMode: data.fileDragMode,
    NonselectedPictureText: data.nonselectedPictureText,
    BorderColor: exportColorToXML(data.borderColor),
  }
}