import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"

export const importMetadataDocumentNumeratorFromXML = (
  context: ConfigurationContext,
  xml: MetadataDocumentNumeratorXML | undefined
): MetadataDocumentNumerator | undefined => {
  if (!xml) return undefined

  return {
    checkUnique: xml.CheckUnique,
    comment: xml.Comment,
    name: xml.Name,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    objectBelonging: xml.ObjectBelonging,
    synonym: importI8nTextFromXML(context, xml.Synonym),
  }
}
