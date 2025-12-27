import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { Popup, PopupEnterprise } from "~/metadata/forms/elements/popup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPopupToEnterprise = (context: Context, data: Popup | undefined): PopupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    Картинка: exportPictureToEnterprise(context, data.picture),
    Отображение: exportSystemEnumerationToEnterprise(context, data.representation, SE.ButtonRepresentationToEnterprise),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      context,
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    Фигура: exportSystemEnumerationToEnterprise(context, data.shape, SE.ButtonShapeToEnterprise),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
  })
}

registerMetadata("ExportToEnterprise", "Popup", exportPopupToEnterprise)
