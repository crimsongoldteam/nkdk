import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Popup, PopupEnterprise } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPopupToEnterprise = (
  data: Popup | undefined,
  configurationSettings: ConfigurationSettings
): PopupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.ButtonRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Фигура: exportSystemEnumerationToEnterprise(data.shape, SE.ButtonShapeToEnterprise, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Popup", exportPopupToEnterprise)
