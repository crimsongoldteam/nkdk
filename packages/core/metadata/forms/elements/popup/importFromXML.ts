import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPopupFromXML = (context: ConfigurationContext, xml: PopupXML | undefined): Popup | undefined => {
  if (!xml) return undefined

  const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: Popup = {
    elementType: FormElementType.Popup,
    ...restFields,
  }

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.Shape !== undefined) result.shape = xml.Shape

  if (xml.ShapeRepresentation !== undefined) result.shapeRepresentation = xml.ShapeRepresentation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result
}

registerMetadata("ImportFromXML", "Popup", importPopupFromXML)
