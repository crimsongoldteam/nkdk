import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPictureFieldXML, TPictureField } from "./types"

export const exportPictureFieldToXML = (data: TPictureField | undefined): TPictureFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    Hyperlink: data.hyperlink,
    ValuesPicture: data.valuesPicture,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Scale: data.scale,
    Zoomable: data.zoomable,
    PictureSize: data.pictureSize,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    Border: exportBorderToXML(data.border),
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    FileDragMode: data.fileDragMode,
    NonselectedPictureText: data.nonselectedPictureText,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}