import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/lib/metadata/commonObjects/indexField/importFromXML"

export const importAdditionalIndexFromXML = (xml: AdditionalIndexXML | undefined): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return {
    additionalFields: importIndexFieldsFromXML(xml.AdditionalFields),
    indexedFields: importIndexFieldsFromXML(xml.IndexedFields),
    name: xml.Name,
    table: xml.Table,
  }
}

export const importAdditionalIndexesFromXML = (
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(value)!)
}
