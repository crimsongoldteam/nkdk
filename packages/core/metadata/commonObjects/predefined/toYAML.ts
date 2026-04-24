import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsYAML, PredefinedYAML } from "./types"

export const exportPredefinedToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Predefined | undefined
): PredefinedYAML | undefined => {
  if (!data) return undefined

  return {
    Код: data.code,
    Наименование: data.description,
    ЭтоГруппа: data.isFolder,
  }
}

export const exportPredefinedItemsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItems | undefined
): PredefinedItemsYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((item) => [item.name, exportPredefinedToYAML(_context, undefined, item)!])
  ) as PredefinedItemsYAML
}

registerTypeRule("Predefined", "exportToYAML", exportPredefinedItemsToYAML)
