import { importBorderFromXML } from "~/packages/core/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/packages/core/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormDecorationFromXML } from "~/packages/core/metadata/forms/elements/formDecoration/importFromXML"
import {
  PictureDecoration,
  PictureDecorationXML,
} from "~/packages/core/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importPictureDecorationFromXML = (
  context: Context,
  xml: PictureDecorationXML | undefined
): PictureDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormDecorationFromXML(context, xml)!,
    elementType: FormElementType.PictureDecoration,

    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(context, xml.Picture),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    zoomable: xml.Zoomable,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PictureDecoration", importPictureDecorationFromXML)
