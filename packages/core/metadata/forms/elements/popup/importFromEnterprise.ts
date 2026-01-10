import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { Popup, PopupEnterprise } from "~/metadata/forms/elements/popup/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPopupFromEnterprise = <
  From extends PopupEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, Popup, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, Popup, Name>

  const baseFields = importFormGroupFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, Popup, Name> = {
    ...baseFields,
    elementType: FormElementType.Popup,
  }

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonRepresentation>(
    context,
    data.Отображение,
    SE.ButtonRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const shapeRepresentation = importSystemEnumerationFromEnterprise<SE.ButtonShapeRepresentation>(
    context,
    data.ОтображениеФигуры,
    SE.ButtonShapeRepresentationFromEnterprise
  )
  if (shapeRepresentation !== undefined) result.shapeRepresentation = shapeRepresentation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const shape = importSystemEnumerationFromEnterprise<SE.ButtonShape>(
    context,
    data.Фигура,
    SE.ButtonShapeFromEnterprise
  )
  if (shape !== undefined) result.shape = shape

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  return result
}

registerMetadata("ImportFromEnterprise", "Popup", importPopupFromEnterprise)
