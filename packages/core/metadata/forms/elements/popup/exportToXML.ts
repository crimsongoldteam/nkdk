import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPopupToXML = (context: ConfigurationContext, data: Popup | undefined): PopupXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  const result: PopupXML = {
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const picture = exportPictureToXML(context, data.picture)
  if (picture !== undefined) result.Picture = picture

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.shape !== undefined) result.Shape = data.shape

  if (data.shapeRepresentation !== undefined) result.ShapeRepresentation = data.shapeRepresentation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return result
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML)
