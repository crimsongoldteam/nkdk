import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/packages/core/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/packages/core/metadata/forms/elements/popup/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
