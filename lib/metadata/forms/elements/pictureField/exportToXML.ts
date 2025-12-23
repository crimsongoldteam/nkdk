import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { PictureField, PictureFieldXML } from "~/lib/metadata/forms/elements/pictureField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPictureFieldToXML = (
  configurationSettings: Context,
  data: PictureField | undefined
): PictureFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(configurationSettings, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Border: exportBorderToXML(configurationSettings, data.border),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(configurationSettings, data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    NonselectedPictureText: data.nonselectedPictureText,
    PictureSize: data.pictureSize,
    Scale: data.scale,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    ValuesPicture: exportPictureToXML(configurationSettings, data.valuesPicture),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Zoomable: data.zoomable,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "PictureField", exportPictureFieldToXML)
