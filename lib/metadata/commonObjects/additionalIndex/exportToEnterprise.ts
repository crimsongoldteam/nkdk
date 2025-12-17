import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToEnterprise } from "~/lib/metadata/commonObjects/indexField/exportToEnterprise"

export const exportAdditionalIndexToEnterprise = (
  data: AdditionalIndex | undefined
): AdditionalIndexEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеПоля: exportIndexFieldsToEnterprise(data.additionalFields),
    ИндексируемыеПоля: exportIndexFieldsToEnterprise(data.indexedFields),
    Имя: data.name,
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToEnterprise = (
  data: AdditionalIndexes | undefined
): AdditionalIndexesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToEnterprise(value)!)
}
