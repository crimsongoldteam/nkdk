import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TPopupXML, TPopup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPopupFromXML = (xml: TPopupXML | undefined): TPopup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Popup,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    picture: importPictureFromXML(xml.Picture),
    representation: xml.Representation,
    shape: xml.Shape,
    shapeRepresentation: xml.ShapeRepresentation,
  }
}

registerImport(ZElementType.enum.Popup, importPopupFromXML)