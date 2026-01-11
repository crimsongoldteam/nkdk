import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export const importCommandBarFromXML = <From extends CommandBarXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, CommandBar> => {
  if (!xml) return undefined as ImportExportReturn<From, CommandBar>

  const baseFields = importFormGroupFromXML(context, xml)

  const result: ImportExportReturn<From, CommandBar> = {
    ...baseFields,
    elementType: FormElementType.CommandBar,
  }

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result
}

registerMetadata<CommandBarXML>("ImportFromXML", "CommandBar", importCommandBarFromXML)
