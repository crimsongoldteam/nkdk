import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/packages/core/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToEnterprise } from "~/packages/core/metadata/commonObjects/indexField/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"

export const exportAdditionalIndexToEnterprise = (
  context: Context,
  data: AdditionalIndex | undefined
): AdditionalIndexEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ДополнительныеПоля: exportIndexFieldsToEnterprise(context, data.additionalFields),
    Имя: data.name,
    ИндексируемыеПоля: exportIndexFieldsToEnterprise(context, data.indexedFields),
    Таблица: data.table,
  })
}

export const exportAdditionalIndexesToEnterprise = (
  context: Context,
  data: AdditionalIndexes | undefined
): AdditionalIndexesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToEnterprise(context, value)!)
}
