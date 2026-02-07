import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToEnterprise } from "~/metadata/commonObjects/indexField/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportAdditionalIndexToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: AdditionalIndex | undefined
): AdditionalIndexEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеПоля: exportIndexFieldsToEnterprise(context, undefined, data.additionalFields),
    Имя: data.name,
    ИндексируемыеПоля: exportIndexFieldsToEnterprise(context, undefined, data.indexedFields),
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: AdditionalIndexes | undefined
): AdditionalIndexesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToEnterprise(context, undefined, value)!)
}
