import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
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

  return {
    ...baseFields,
    elementType: FormElementType.ButtonGroup,

    representation: xml.Representation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
  }
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
