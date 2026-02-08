import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const exportPredefinedToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
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
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: PredefinedItems | undefined
): PredefinedItemsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((item) => [item.name, exportPredefinedToEnterprise(_context, undefined, item)!])
  ) as PredefinedItemsEnterprise
}
