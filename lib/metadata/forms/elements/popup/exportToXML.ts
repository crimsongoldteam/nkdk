import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportPopupToXML = (data: Popup | undefined): PopupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Picture: exportPictureToXML(data.picture),
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.Popup, exportPopupToXML)
