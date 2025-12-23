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
