import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importButtonGroupChildItemsFromXML } from "~/metadata/forms/collections/buttonGroupChildItems/importFromXML"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"

export function importPopupFromXML<To extends Popup | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormGroupFromXML(context, xml)

  const result: Popup = {
    ...baseFields,
    elementType: FormElementType.Popup,
    childItems: [],
  }

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  result.childItems = importButtonGroupChildItemsFromXML(context, xml.ChildItems)

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.Shape !== undefined) result.shape = xml.Shape

  if (xml.ShapeRepresentation !== undefined) result.shapeRepresentation = xml.ShapeRepresentation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result as To
}

registerMetadata("ImportFromXML", "Popup", importPopupFromXML)
