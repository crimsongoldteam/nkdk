import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { exportFormGroupPropsToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function exportPopupToXML<From extends Popup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportFormGroupPropsToXML(context, data)

  const extendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const result: PopupXML = {
    ExtendedTooltip: extendedTooltip,
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

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

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML)
