import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPictureDecorationFromXML = (
  xml: PictureDecorationXML | undefined
): PictureDecoration | undefined => {
  if (!xml) return undefined

  return {
    ...importFormDecorationFromXML(xml)!,
    elementType: FormElementType.PictureDecoration,

    border: importBorderFromXML(xml.Border),
    borderColor: importColorFromXML(xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(xml.Picture),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    zoomable: xml.Zoomable,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.PictureDecoration, importPictureDecorationFromXML)
