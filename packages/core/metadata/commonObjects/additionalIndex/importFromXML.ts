import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/metadata/commonObjects/indexField/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"

export const importAdditionalIndexFromXML = (
  context: ConfigurationContext,
  xml: AdditionalIndexXML | undefined
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return {
    additionalFields: importIndexFieldsFromXML(context, xml.AdditionalFields),
    indexedFields: importIndexFieldsFromXML(context, xml.IndexedFields),
    name: xml.Name,
    table: xml.Table,
  }
}

export const importAdditionalIndexesFromXML = (
  context: ConfigurationContext,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(context, value)!)
}
