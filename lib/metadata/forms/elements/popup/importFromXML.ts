import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Popup, PopupXML } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPopupFromXML = (context: Context, xml: PopupXML | undefined): Popup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.Popup,

    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    picture: importPictureFromXML(context, xml.Picture),
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
  })
}

registerMetadata("ImportFromXML", "Popup", importPopupFromXML)
