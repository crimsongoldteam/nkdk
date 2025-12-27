import {
  AdditionalIndex,
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexXML,
} from "~/packages/core/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToXML } from "~/packages/core/metadata/commonObjects/indexField/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"

export const exportAdditionalIndexToXML = (
  context: Context,
  data: AdditionalIndex | undefined
): AdditionalIndexXML | undefined => {
  if (!data) return undefined

  return compactObject({
    AdditionalFields: exportIndexFieldsToXML(context, data.additionalFields),
    IndexedFields: exportIndexFieldsToXML(context, data.indexedFields),
    Name: data.name,
    Table: data.table,
  })
}

export const exportAdditionalIndexesToXML = (
  context: Context,
  data: AdditionalIndexes | undefined
): AdditionalIndexesXML | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToXML(context, value)!)
}
