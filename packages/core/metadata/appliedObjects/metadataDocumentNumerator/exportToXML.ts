import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportMetadataDocumentNumeratorToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataDocumentNumerator | undefined
): MetadataDocumentNumeratorXML | undefined => {
  if (!data) return undefined

  const result: MetadataDocumentNumeratorXML = {} as MetadataDocumentNumeratorXML

  if (data.checkUnique !== undefined) result.CheckUnique = data.checkUnique

  if (data.comment !== undefined) result.Comment = data.comment

  if (data.name !== undefined) result.Name = data.name

  if (data.numberAllowedLength !== undefined) result.NumberAllowedLength = data.numberAllowedLength

  if (data.numberLength !== undefined) result.NumberLength = data.numberLength

  if (data.numberPeriodicity !== undefined) result.NumberPeriodicity = data.numberPeriodicity

  if (data.numberType !== undefined) result.NumberType = data.numberType

  if (data.objectBelonging !== undefined) result.ObjectBelonging = data.objectBelonging

  const synonym = exportI8nTextToXML(context, { type: "I8nText" }, data.synonym)
  if (synonym !== undefined) result.Synonym = synonym

  return result
}
