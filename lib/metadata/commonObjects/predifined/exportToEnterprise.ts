import { Context } from "../../context/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const exportPredefinedToEnterprise = (
  _configurationSettings: Context,
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
  _configurationSettings: Context,
  data: PredefinedItems | undefined
): PredefinedItemsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((item) => [item.name, exportPredefinedToEnterprise(_configurationSettings, item)!])
  ) as PredefinedItemsEnterprise
}
