import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CommandBar, CommandBarXML } from "~/lib/metadata/forms/elements/commandBar/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importCommandBarFromXML = (
  xml: CommandBarXML | undefined,
  configurationSettings: ConfigurationSettings
): CommandBar | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(xml, configurationSettings)!,
    elementType: FormElementType.CommandBar,

    autofill: xml.Autofill,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "CommandBar", importCommandBarFromXML)
