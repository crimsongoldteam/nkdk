import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

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
