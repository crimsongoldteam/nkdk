import {
  AdditionalIndex,
  AdditionalIndexEnterprise,
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { exportIndexFieldsToEnterprise } from "~/lib/metadata/commonObjects/indexField/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const exportAdditionalIndexToEnterprise = (
  data: AdditionalIndex | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndexEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеПоля: exportIndexFieldsToEnterprise(data.additionalFields, configurationSettings),
    ИндексируемыеПоля: exportIndexFieldsToEnterprise(data.indexedFields, configurationSettings),
    Имя: data.name,
    Таблица: data.table,
  }
}

export const exportAdditionalIndexesToEnterprise = (
  data: AdditionalIndexes | undefined,
  configurationSettings: ConfigurationSettings
): AdditionalIndexesEnterprise | undefined => {
  if (!data) return undefined

  return data.map((value: AdditionalIndex) => exportAdditionalIndexToEnterprise(value, configurationSettings)!)
}
