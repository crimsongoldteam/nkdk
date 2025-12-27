import { exportBorderToXML } from "~/packages/core/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/packages/core/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormDecorationToXML } from "~/packages/core/metadata/forms/elements/formDecoration/exportToXML"
import {
  PictureDecoration,
  PictureDecorationXML,
} from "~/packages/core/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportPictureDecorationToXML = (
  context: Context,
  data: PictureDecoration | undefined
): PictureDecorationXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToXML(context, data)!,

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
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "PictureDecoration", exportPictureDecorationToXML)
