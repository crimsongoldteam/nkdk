import { registerImport } from "~/lib/xml/import/importerFactory"
import { importTableFromXML } from "../table/importFromXML"
import { FormElementType } from "../types"

export const importAdditionalIndexFromXML = (xml: AdditionalIndexXML | undefined): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.AdditionalIndex,

    additionalFields: xml.AdditionalFields,
    indexedFields: xml.IndexedFields,
    table: importTableFromXML(xml.Table),
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.AdditionalIndex, importAdditionalIndexFromXML)
