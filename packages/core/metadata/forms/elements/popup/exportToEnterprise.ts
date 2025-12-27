import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/packages/core/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/packages/core/metadata/forms/elements/formGroup/exportToEnterprise"
import { Popup, PopupEnterprise } from "~/packages/core/metadata/forms/elements/popup/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

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
