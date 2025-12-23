import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPopupToXML = (
  configurationSettings: ConfigurationSettings,
  data: Popup | undefined
): PopupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(configurationSettings, data)!,

    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    Picture: exportPictureToXML(configurationSettings, data.picture),
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
  })
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML)
