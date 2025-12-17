import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importButtonGroupFromXML = (xml: ButtonGroupXML | undefined): ButtonGroup | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml)!,
    elementType: FormElementType.ButtonGroup,

    representation: xml.Representation,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.ButtonGroup, importButtonGroupFromXML)
