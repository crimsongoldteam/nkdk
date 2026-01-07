import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/metadata/commonObjects/indexField/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"

export const exportAdditionalIndexToXML = (
  context: ConfigurationContext,
  data: AdditionalIndex | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: exportIndexFieldsToXML(context, data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(context, data.indexedFields),
    Name: data.name,
    Table: data.table,
  }
}

export const exportAdditionalIndexesToXML = (
  context: ConfigurationContext,
  data: AdditionalIndexes | undefined
): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(context, value)!)
}
