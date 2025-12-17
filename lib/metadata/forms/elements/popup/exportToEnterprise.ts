import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Popup, PopupEnterprise } from "~/lib/metadata/forms/elements/popup/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPopupToEnterprise = (data: Popup | undefined): PopupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Картинка: exportPictureToEnterprise(data.picture),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.ButtonRepresentationToEnterprise),
    Фигура: exportSystemEnumerationToEnterprise(data.shape, SE.ButtonShapeToEnterprise),
    ОтображениеФигуры: exportSystemEnumerationToEnterprise(
      data.shapeRepresentation,
      SE.ButtonShapeRepresentationToEnterprise
    ),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.Popup, exportPopupToEnterprise)
