import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importButtonGroupFromXML = (
  xml: ButtonGroupXML | undefined,
  configurationSettings: ConfigurationSettings
): ButtonGroup | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml, configurationSettings)!,
    elementType: FormElementType.ButtonGroup,

    representation: xml.Representation,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
  }
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
