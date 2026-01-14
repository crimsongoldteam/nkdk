import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importButtonGroupChildItemsFromXML } from "~/metadata/forms/collections/buttonGroupChildItems/importFromXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importButtonGroupFromXML<To extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importFormGroupFromXML(context, xml)

  const childItems = importButtonGroupChildItemsFromXML(context, xml.ChildItems)

  const result: ButtonGroup = {
    ...baseFields,
    elementType: FormElementType.ButtonGroup,
    childItems: childItems,
  }

  if (xml.Representation !== undefined) result.representation = xml.Representation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result as To
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
