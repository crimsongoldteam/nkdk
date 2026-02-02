import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const exportPredefinedToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: Predefined | undefined
): PredefinedEnterprise | undefined => {
  if (!data) return undefined

  return {
    Код: data.code,
    Наименование: data.name,
    ЭтоГруппа: data.isFolder,
  }
}

export const exportPredefinedItemsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: PredefinedItems | undefined
): PredefinedItemsEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((item) => [item.name, exportPredefinedToYAML(_context, _rule, item)!])
  ) as PredefinedItemsEnterprise
}
