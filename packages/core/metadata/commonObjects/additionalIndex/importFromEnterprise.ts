import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromEnterprise } from "~/metadata/commonObjects/indexField/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"

export const importAdditionalIndexFromEnterprise = (
  context: ConfigurationContext,
  data: AdditionalIndexEnterprise | undefined
): AdditionalIndex | undefined => {
  if (!data) return undefined

  return {
    additionalFields: importIndexFieldsFromEnterprise(context, data.ДополнительныеПоля),
    indexedFields: importIndexFieldsFromEnterprise(context, data.ИндексируемыеПоля),
    name: data.Имя,
    table: data.Таблица,
  }
}

export const importAdditionalIndexesFromEnterprise = (
  context: ConfigurationContext,
  data: AdditionalIndexesEnterprise | undefined
): AdditionalIndexes | undefined => {
  if (!data) return undefined

  return data
    .map((value: AdditionalIndexEnterprise) => importAdditionalIndexFromEnterprise(context, value)!)
    .filter((item): item is AdditionalIndex => item !== undefined)
}
