import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importCommandBarFromXML = (
  context: ConfigurationContext,
  xml: CommandBarXML | undefined
): CommandBar | undefined => {
  if (!xml) return undefined

  return {
    const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,,
    elementType: FormElementType.CommandBar,

    autofill: xml.Autofill,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),  }
}

registerMetadata<CommandBarXML>("ImportFromXML", "CommandBar", importCommandBarFromXML)
