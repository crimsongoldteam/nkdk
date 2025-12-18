import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/lib/metadata/commonObjects/indexField/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const exportAdditionalIndexToXML = (
  data: AdditionalIndex | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: exportIndexFieldsToXML(data.additionalFields, configurationSettings),
    IndexedFields: exportIndexFieldsToXML(data.indexedFields, configurationSettings),
    Name: data.name,
    Table: data.table,
  }
}

export const exportAdditionalIndexesToXML = (
  data: AdditionalIndexes | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(value, configurationSettings)!)
}
