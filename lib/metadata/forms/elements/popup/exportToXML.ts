import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPopupToXML = (
  data: Popup | undefined,
  configurationSettings: ConfigurationSettings
): PopupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(data, configurationSettings)!,

    BackColor: exportColorToXML(data.backColor, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    Picture: exportPictureToXML(data.picture, configurationSettings),
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML)
