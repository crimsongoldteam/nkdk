import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TPopupXML, TPopup } from "./types"
import { ZElementType } from "../types"

export const importPopupFromXML = (xml: TPopupXML | undefined): TPopup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Popup,
    picture: importPictureFromXML(xml.Picture),
    representation: xml.Representation,
    shapeRepresentation: xml.ShapeRepresentation,
    shape: xml.Shape,
    borderColor: importColorFromXML(xml.BorderColor),
    backColor: importColorFromXML(xml.BackColor),
  }
}