import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importMetadataDocumentNumeratorFromXML = (
  xml: MetadataDocumentNumeratorXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentNumerator | undefined => {
  if (!xml) return undefined

  return compactObject({
    checkUnique: xml.CheckUnique,
    comment: xml.Comment,
    name: xml.Name,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    objectBelonging: xml.ObjectBelonging,
    synonym: importI8nTextFromXML(xml.Synonym, configurationSettings),
  })
}
