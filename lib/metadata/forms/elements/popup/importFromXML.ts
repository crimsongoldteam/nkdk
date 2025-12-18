import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Popup, PopupXML } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPopupFromXML = (
  xml: PopupXML | undefined,
  configurationSettings: ConfigurationSettings
): Popup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(xml, configurationSettings)!,
    elementType: FormElementType.Popup,

    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    picture: importPictureFromXML(xml.Picture, configurationSettings),
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "Popup", importPopupFromXML)
