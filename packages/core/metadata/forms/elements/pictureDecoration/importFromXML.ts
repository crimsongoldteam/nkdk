import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

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
