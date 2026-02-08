import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/metadata/commonObjects/additionalIndex/types"
import { importIndexFieldsFromEnterprise } from "~/metadata/commonObjects/indexField/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importAdditionalIndexFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndexEnterprise | undefined
): AdditionalIndex | undefined => {
  if (!data) return undefined

  return {
    additionalFields: importIndexFieldsFromEnterprise(context, undefined, data.ДополнительныеПоля),
    indexedFields: importIndexFieldsFromEnterprise(context, undefined, data.ИндексируемыеПоля),
    name: data.Имя,
    table: data.Таблица,
  }
}

export const importAdditionalIndexesFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: AdditionalIndexesEnterprise | undefined
): AdditionalIndexes | undefined => {
  if (!data) return undefined

  return data
    .map((value: AdditionalIndexEnterprise) => importAdditionalIndexFromEnterprise(context, undefined, value)!)
    .filter((item): item is AdditionalIndex => item !== undefined)
}
