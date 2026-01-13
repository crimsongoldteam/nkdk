import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importButtonGroupChildItemsFromXML } from "~/metadata/forms/collections/buttonGroupChildItems/importFromXML"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importCommandBarFromXML<From extends CommandBarXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  const baseFields = importFormGroupFromXML(context, xml)

  const result: CommandBar = {
    ...baseFields,
    elementType: FormElementType.CommandBar,
    childItems: [],
  }

  const childItems = importButtonGroupChildItemsFromXML(context, xml.ПодчиненныеЭлементы)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "CommandBar", importCommandBarFromXML)
