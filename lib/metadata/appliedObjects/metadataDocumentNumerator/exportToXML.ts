import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

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
