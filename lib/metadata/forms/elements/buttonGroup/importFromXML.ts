import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importButtonGroupFromXML = (
  context: Context,
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
