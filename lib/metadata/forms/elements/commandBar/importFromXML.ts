import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importCommandBarFromXML = (xml: CommandBarXML | undefined): CommandBar | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml)!,
    elementType: FormElementType.CommandBar,

    autofill: xml.Autofill,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.CommandBar, importCommandBarFromXML)
