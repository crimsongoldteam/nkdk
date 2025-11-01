import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPictureFieldXML, TPictureField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPictureFieldToXML = (data: TPictureField | undefined): TPictureFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    NonselectedPictureText: data.nonselectedPictureText,
    PictureSize: data.pictureSize,
    Scale: data.scale,
    TextColor: exportColorToXML(data.textColor),
    ValuesPicture: exportPictureToXML(data.valuesPicture),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Zoomable: data.zoomable,
  }
}

registerExport(ZElementType.enum.PictureField, exportPictureFieldToXML)