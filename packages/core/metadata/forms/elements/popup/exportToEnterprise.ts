import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupPartialToEnterprise, exportFormGroupTypedToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import {
  Popup,
  PopupPartialEnterprise,
  PopupTypedEnterprise,
} from "~/metadata/forms/elements/popup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportButtonGroupChildItemsToEnterprise } from "../../collections/buttonGroupChildItems/exportToEnterprise"

export const exportPopupTypedToEnterprise = (
  context: ConfigurationContext,
  data: Popup | undefined
): PopupTypedEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupTypedToEnterprise(context, data)
  if (baseFields === undefined) return undefined

  const props = exportPopupPropsToEnterprise(context, data)

  const result: PopupTypedEnterprise = {
    ...baseFields,
    ...props,
    Тип: "Подменю",
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportPopupPartialToEnterprise = (
  context: ConfigurationContext,
  data: Popup
): PopupPartialEnterprise => {
  const baseFields = exportFormGroupPartialToEnterprise(context, data)

  const props = exportPopupPropsToEnterprise(context, data)

  const result: PopupPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

const exportPopupPropsToEnterprise = (
  context: ConfigurationContext,
  data: Popup
): PopupPartialEnterprise => {
  const result: PopupPartialEnterprise = {}

  const picture = exportPictureToEnterprise(context, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const representation = exportSystemEnumerationToEnterprise(
    context,
    data.representation,
    SE.ButtonRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const shapeRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.shapeRepresentation,
    SE.ButtonShapeRepresentationToEnterprise
  )
  if (shapeRepresentation !== undefined) result.ОтображениеФигуры = shapeRepresentation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const shape = exportSystemEnumerationToEnterprise(context, data.shape, SE.ButtonShapeToEnterprise)
  if (shape !== undefined) result.Фигура = shape

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const childItems = exportButtonGroupChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata("ExportPartialToEnterprise", "Popup", exportPopupPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "Popup", exportPopupTypedToEnterprise)
