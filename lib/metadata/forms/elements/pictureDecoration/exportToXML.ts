import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { PictureDecoration, PictureDecorationXML } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPictureDecorationToXML = (
  configurationSettings: Context,
  data: PictureDecoration | undefined
): PictureDecorationXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToXML(configurationSettings, data)!,

    Border: exportBorderToXML(configurationSettings, data.border),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Hyperlink: data.hyperlink,
    NonselectedPictureText: data.nonselectedPictureText,
    Picture: exportPictureToXML(configurationSettings, data.picture),
    PictureSize: data.pictureSize,
    Scale: data.scale,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    Zoomable: data.zoomable,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "PictureDecoration", exportPictureDecorationToXML)
