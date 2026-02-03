import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const importPredefinedFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedEnterprise | undefined,
  name: string
): Predefined | undefined => {
  if (!data) return undefined

  return {
    name,
    code: data.Код,
    description: data.Наименование,
    isFolder: data.ЭтоГруппа,
  }
}

export const importPredefinedItemsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItemsEnterprise | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importPredefinedFromEnterprise(context, undefined, value, name))
    .filter((item): item is Predefined => item !== undefined)
}
