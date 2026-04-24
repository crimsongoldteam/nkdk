import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsYAML, PredefinedYAML } from "./types"

export const importPredefinedFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedYAML | undefined,
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

export const importPredefinedItemsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItemsYAML | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importPredefinedFromYAML(context, undefined, value, name))
    .filter((item): item is Predefined => item !== undefined)
}

registerTypeRule("Predefined", "importFromYAML", importPredefinedItemsFromYAML)
