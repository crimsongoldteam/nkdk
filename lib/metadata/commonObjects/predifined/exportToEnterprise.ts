import { ConfigurationSettings } from "../../configurationSettings/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const exportPredefinedToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: Predefined | undefined
): PredefinedEnterprise | undefined => {
  if (!data) return undefined

  return {
    Код: data.code,
    Наименование: data.name,
    ЭтоГруппа: data.isFolder,
  }
}

export const exportPredefinedItemsToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: PredefinedItems | undefined
): PredefinedItemsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((item) => [item.name, exportPredefinedToEnterprise(_configurationSettings, item)!])
  ) as PredefinedItemsEnterprise
}
