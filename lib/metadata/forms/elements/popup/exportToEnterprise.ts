import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Popup, PopupEnterprise } from "~/lib/metadata/forms/elements/popup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPopupToEnterprise = (
  configurationSettings: Context,
  data: Popup | undefined
): PopupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    Картинка: exportPictureToEnterprise(configurationSettings, data.picture),
    Отображение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.representation,
      SE.ButtonRepresentationToEnterprise
    ),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    Фигура: exportSystemEnumerationToEnterprise(configurationSettings, data.shape, SE.ButtonShapeToEnterprise),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
  })
}

registerMetadata("ExportToEnterprise", "Popup", exportPopupToEnterprise)
