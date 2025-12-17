import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/lib/metadata/commonObjects/indexField/exportToXML"

export const exportAdditionalIndexToXML = (data: AdditionalIndex | undefined): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalFields: exportIndexFieldsToXML(data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(data.indexedFields),
    Name: data.name,
    Table: data.table,
  }
}

export const exportAdditionalIndexesToXML = (data: AdditionalIndexes | undefined): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(value)!)
}
