import { ConfigurationSettings } from "../../configurationSettings/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const exportPredefinedToEnterprise = (
  data: Predefined | undefined,
  _configurationSettings: ConfigurationSettings
): PredefinedEnterprise | undefined => {
  if (!data) return undefined

  return {
    Код: data.code,
    Наименование: data.name,
    ЭтоГруппа: data.isFolder,
  }
}

export const exportPredefinedItemsToEnterprise = (
  data: PredefinedItems | undefined,
  _configurationSettings: ConfigurationSettings
): PredefinedItemsEnterprise | undefined => {
  if (!data) return undefined

  return new Map(data.map((item) => [item.name, exportPredefinedToEnterprise(item, _configurationSettings)!]))
}
