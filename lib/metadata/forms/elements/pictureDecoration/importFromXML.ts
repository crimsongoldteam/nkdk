import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPictureDecorationFromXML = (
  xml: PictureDecorationXML | undefined,
  configurationSettings: ConfigurationSettings
): PictureDecoration | undefined => {
  if (!xml) return undefined

  return {
    ...importFormDecorationFromXML(xml, configurationSettings)!,
    elementType: FormElementType.PictureDecoration,

    border: importBorderFromXML(xml.Border, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    fileDragMode: xml.FileDragMode,
    hyperlink: xml.Hyperlink,
    nonselectedPictureText: xml.NonselectedPictureText,
    picture: importPictureFromXML(xml.Picture, configurationSettings),
    pictureSize: xml.PictureSize,
    scale: xml.Scale,
    zoomable: xml.Zoomable,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    events: importEventsFromXML(xml.Events, configurationSettings),
  }
}

registerMetadata("ImportFromXML", "PictureDecoration", importPictureDecorationFromXML)
