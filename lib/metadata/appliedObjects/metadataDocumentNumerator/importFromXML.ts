import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importMetadataDocumentNumeratorFromXML = (
  xml: MetadataDocumentNumeratorXML | undefined
): MetadataDocumentNumerator | undefined => {
  if (!xml) return undefined

  return {
    elementType: FormElementType.MetadataDocumentNumerator,

    checkUnique: xml.CheckUnique,
    comment: xml.Comment,
    name: xml.Name,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    objectBelonging: xml.ObjectBelonging,
    synonym: importI8nTextFromXML(xml.Synonym),
  }
}

registerImport(FormElementType.MetadataDocumentNumerator, importMetadataDocumentNumeratorFromXML)
