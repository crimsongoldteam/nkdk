import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPictureDecorationFromXML = (
  configurationSettings: ConfigurationSettings, xml: PictureDecorationXML | undefined
): PictureDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormDecorationFromXML(configurationSettings, xml)!,
    elementType: FormElementType.PictureDecoration,

    border: importBorderFromXML(configurationSettings, xml.Border),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(configurationSettings, xml.Picture),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    zoomable: xml.Zoomable,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PictureDecoration", importPictureDecorationFromXML)
