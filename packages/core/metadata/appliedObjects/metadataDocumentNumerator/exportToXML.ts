import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/packages/core/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"

export const exportMetadataDocumentNumeratorToXML = (
  context: Context,
  data: MetadataDocumentNumerator | undefined
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
    Synonym: exportI8nTextToXML(context, data.synonym),
  })
}
