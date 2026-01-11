import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importButtonGroupChildItemsFromXML } from "~/metadata/forms/collections/buttonGroupChildItems/importFromXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importButtonGroupFromXML = (
  context: ConfigurationContext,
  xml: ButtonGroupXML | undefined
): ButtonGroup | undefined => {
  if (!xml) return undefined
  const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: ButtonGroup = {
    elementType: FormElementType.ButtonGroup,
    ...restFields,
  }

  const childItems = importButtonGroupChildItemsFromXML(context, xml.ПодчиненныеЭлементы)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  if (xml.Representation !== undefined) result.representation = xml.Representation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
