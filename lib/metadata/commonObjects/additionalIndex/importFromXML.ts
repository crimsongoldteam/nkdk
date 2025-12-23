import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromXML } from "~/lib/metadata/commonObjects/indexField/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importAdditionalIndexFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: AdditionalIndexXML | undefined
): AdditionalIndex | undefined => {
  if (!xml) return undefined

  return compactObject({
    additionalFields: importIndexFieldsFromXML(configurationSettings, xml.AdditionalFields),
    indexedFields: importIndexFieldsFromXML(configurationSettings, xml.IndexedFields),
    name: xml.Name,
    table: xml.Table,
  })
}

export const importAdditionalIndexesFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: AdditionalIndexesXML | undefined
): AdditionalIndexes | undefined => {
  if (!xml) return undefined

  return xml.map((value: AdditionalIndexXML) => importAdditionalIndexFromXML(configurationSettings, value)!)
}
