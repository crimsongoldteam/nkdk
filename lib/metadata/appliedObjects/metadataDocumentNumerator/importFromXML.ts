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
    extendedConfigurationObject: xml.ExtendedConfigurationObject,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    objectBelonging: xml.ObjectBelonging,
    synonym: xml.Synonym,
  }
}

registerImport(FormElementType.MetadataDocumentNumerator, importMetadataDocumentNumeratorFromXML)
