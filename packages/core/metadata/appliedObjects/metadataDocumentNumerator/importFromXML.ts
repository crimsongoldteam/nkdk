import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/packages/core/metadata/appliedObjects/metadataDocumentNumerator/types"
import { importI8nTextFromXML } from "~/packages/core/metadata/commonObjects/i8nText/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"

export const importMetadataDocumentNumeratorFromXML = (
  context: Context,
  xml: MetadataDocumentNumeratorXML | undefined
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
    synonym: importI8nTextFromXML(context, xml.Synonym),
  })
}
