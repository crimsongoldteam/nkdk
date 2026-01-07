import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"

export const exportMetadataDocumentNumeratorToXML = (
  context: ConfigurationContext,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorXML | undefined => {
  if (!data) return undefined

  return {
    CheckUnique: data.checkUnique,
    Comment: data.comment,
    Name: data.name,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    ObjectBelonging: data.objectBelonging,
    Synonym: exportI8nTextToXML(context, data.synonym),
  }
}
