import { Context } from "../../context/types"
import { Predefined, PredefinedEnterprise, PredefinedItems, PredefinedItemsEnterprise } from "./types"

export const importPredefinedFromEnterprise = (
  _context: Context,
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
  context: Context,
  data: PredefinedItemsEnterprise | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importPredefinedFromEnterprise(context, value, name))
    .filter((item): item is Predefined => item !== undefined)
}

