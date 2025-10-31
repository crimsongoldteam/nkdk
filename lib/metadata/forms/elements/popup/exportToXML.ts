import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPopupXML, TPopup } from "./types"

export const exportPopupToXML = (data: TPopup | undefined): TPopupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    Picture: exportPictureToXML(data.picture),
    Representation: data.representation,
    ShapeRepresentation: data.shapeRepresentation,
    Shape: data.shape,
    BorderColor: exportColorToXML(data.borderColor),
    BackColor: exportColorToXML(data.backColor),
  }
}