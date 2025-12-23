import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/lib/metadata/commonObjects/indexField/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportAdditionalIndexToXML = (
  configurationSettings: Context,
  data: AdditionalIndex | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return compactObject({
    AdditionalFields: exportIndexFieldsToXML(configurationSettings, data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(configurationSettings, data.indexedFields),
    Name: data.name,
    Table: data.table,
  })
}

export const exportAdditionalIndexesToXML = (
  configurationSettings: Context,
  data: AdditionalIndexes | undefined
): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(configurationSettings, value)!)
}
