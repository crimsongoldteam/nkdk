import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { PictureField, PictureFieldXML } from "~/metadata/forms/elements/pictureField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPictureFieldToXML = (
  context: Context,
  data: PictureField | undefined
): PictureFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(context, data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    NonselectedPictureText: data.nonselectedPictureText,
    PictureSize: data.pictureSize,
    Scale: data.scale,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    ValuesPicture: exportPictureToXML(context, data.valuesPicture),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Zoomable: data.zoomable,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "PictureField", exportPictureFieldToXML)
