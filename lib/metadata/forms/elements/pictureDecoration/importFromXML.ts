import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

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
