import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importMetadataDocumentNumeratorFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: MetadataDocumentNumeratorXML | undefined
): MetadataDocumentNumerator | undefined => {
  if (!xml) return undefined

  const result: MetadataDocumentNumerator = {} as MetadataDocumentNumerator

  if (xml.CheckUnique !== undefined) result.checkUnique = xml.CheckUnique

  if (xml.Comment !== undefined) result.comment = xml.Comment

  if (xml.Name !== undefined) result.name = xml.Name

  if (xml.NumberAllowedLength !== undefined) result.numberAllowedLength = xml.NumberAllowedLength

  if (xml.NumberLength !== undefined) result.numberLength = xml.NumberLength

  if (xml.NumberPeriodicity !== undefined) result.numberPeriodicity = xml.NumberPeriodicity

  if (xml.NumberType !== undefined) result.numberType = xml.NumberType

  if (xml.ObjectBelonging !== undefined) result.objectBelonging = xml.ObjectBelonging

  const synonym = iimportI8nTextFromXML(context, { type: "I8nText" }, xml.Synonym)
  if (synonym !== undefined) result.synonym = synonym

  return result
}
