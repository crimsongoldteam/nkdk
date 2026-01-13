import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importButtonGroupChildItemsFromXML } from "~/metadata/forms/collections/buttonGroupChildItems/importFromXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importButtonGroupFromXML<From extends ButtonGroupXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined
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

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
