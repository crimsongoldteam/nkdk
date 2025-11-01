import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { TPictureDecorationXML, TPictureDecoration } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["Visible", "UserVisible", "Enabled", "Width", "AutoMaxWidth", "MaxWidth", "Height", "AutoMaxHeight", "HorizontalStretch", "VerticalStretch", "SkipOnInput", "TextColor", "Font", "Shortcut", "Title", "ToolTip", "ToolTipRepresentation", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "Hyperlink", "NonselectedPictureText", "EnableStartDrag", "EnableDrag", "Picture", "FileDragMode", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportPictureDecorationToXML = (data: TPictureDecoration | undefined): TPictureDecorationXML | undefined => {
  if (!data) return undefined

  const base = exportFormDecorationToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TPictureDecorationXML>( {
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
  }, ORDER)
}

registerExport(ZElementType.enum.PictureDecoration, exportPictureDecorationToXML)