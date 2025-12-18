import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportMetadataDocumentNumeratorToXML = (
  data: MetadataDocumentNumerator | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentNumeratorXML | undefined => {
  if (!data) return undefined

  return compactObject({
    CheckUnique: data.checkUnique,
    Comment: data.comment,
    Name: data.name,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    ObjectBelonging: data.objectBelonging,
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
  })
}
