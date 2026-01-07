import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToEnterprise } from "~/metadata/commonObjects/indexField/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"

export const exportAdditionalIndexToEnterprise = (
  context: ConfigurationContext,
  data: AdditionalIndex | undefined
): AdditionalIndexEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеПоля: exportIndexFieldsToEnterprise(context, data.additionalFields),
    Имя: data.name,
    ИндексируемыеПоля: exportIndexFieldsToEnterprise(context, data.indexedFields),
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToEnterprise = (
  context: ConfigurationContext,
  data: AdditionalIndexes | undefined
): AdditionalIndexesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToEnterprise(context, value)!)
}
