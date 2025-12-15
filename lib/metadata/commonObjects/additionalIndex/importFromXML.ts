import { importIndexFieldsFromXML } from "~/lib/metadata/commonObjects/indexField/importFromXML"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importAdditionalIndexFromXML = (xml: AdditionalIndexXML | undefined): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.AdditionalIndex,

    additionalFields: importIndexFieldsFromXML(xml.AdditionalFields),
    indexedFields: importIndexFieldsFromXML(xml.IndexedFields),
    name: xml.Name,
    table: importTableFromXML(xml.Table),
  }
}

registerImport(FormElementType.AdditionalIndex, importAdditionalIndexFromXML)
