import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/metadata/commonObjects/indexField/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"

export const _importAdditionalIndexFromXML = (
  context: ConfigurationContext,
  xml: AdditionalIndexXML | undefined
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  const result: AdditionalIndex = {} as AdditionalIndex

  const additionalFields = importIndexFieldsFromXML(context, xml.AdditionalFields)
  if (additionalFields !== undefined) result.additionalFields = additionalFields

  const indexedFields = importIndexFieldsFromXML(context, xml.IndexedFields)
  if (indexedFields !== undefined) result.indexedFields = indexedFields

  if (xml.Name !== undefined) result.name = xml.Name

  if (xml.Table !== undefined) result.table = xml.Table

  return result
}

export const _importAdditionalIndexesFromXML = (
  context: ConfigurationContext,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(context, value)!)
}
