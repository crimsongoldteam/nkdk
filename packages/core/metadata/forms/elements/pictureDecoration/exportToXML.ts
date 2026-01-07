import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { PictureDecoration, PictureDecorationXML } from "~/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPictureDecorationToXML = (
  context: ConfigurationContext,
  data: PictureDecoration | undefined
): PictureDecorationXML | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormDecorationToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    FileDragMode: data.fileDragMode,
    Hyperlink: data.hyperlink,
    NonselectedPictureText: data.nonselectedPictureText,
    Picture: exportPictureToXML(context, data.picture),
    PictureSize: data.pictureSize,
    Scale: data.scale,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Zoomable: data.zoomable,
    Events: exportEventsToXML(context, data.events),  }
}

registerMetadata("ExportToXML", "PictureDecoration", exportPictureDecorationToXML)
