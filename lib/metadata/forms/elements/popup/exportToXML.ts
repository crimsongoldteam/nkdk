import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPopupXML, TPopup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPopupToXML = (data: TPopup | undefined): TPopupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Picture: exportPictureToXML(data.picture),
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
  }
}

registerExport(ZElementType.enum.Popup, exportPopupToXML)