import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPopupToXML = (context: Context, data: Popup | undefined): PopupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    Picture: exportPictureToXML(context, data.picture),
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML)
