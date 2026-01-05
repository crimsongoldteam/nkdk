import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importButtonGroupFromXML = (
  context: ConfigurationContext,
  xml: ButtonGroupXML | undefined
): ButtonGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.ButtonGroup,

    representation: xml.Representation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
  })
}

registerMetadata("ImportFromXML", "ButtonGroup", importButtonGroupFromXML)
