import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

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
