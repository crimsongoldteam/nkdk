import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/lib/metadata/commonObjects/indexField/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const importAdditionalIndexFromXML = (
  xml: AdditionalIndexXML | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return {
    additionalFields: importIndexFieldsFromXML(xml.AdditionalFields, configurationSettings),
    indexedFields: importIndexFieldsFromXML(xml.IndexedFields, configurationSettings),
    name: xml.Name,
    table: xml.Table,
  }
}

export const importAdditionalIndexesFromXML = (
  xml: AdditionalIndexesXML | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(value, configurationSettings)!)
}
