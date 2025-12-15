import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportMetadataDocumentNumeratorToXML = (
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorXML | undefined => {
  if (!data) return undefined

  return {
    CheckUnique: data.checkUnique,
    Comment: data.comment,
    ExtendedConfigurationObject: data.extendedConfigurationObject,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    ObjectBelonging: data.objectBelonging,
    Synonym: data.synonym,
  }
}

registerExport(FormElementType.MetadataDocumentNumerator, exportMetadataDocumentNumeratorToXML)
