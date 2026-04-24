import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const importPredefinedFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedXML | undefined
): Predefined | undefined => {
  if (!data) return undefined

  const result: Predefined = {
    name: data.Name,
    code: data.Code,
    description: data.Description,
    isFolder: data.IsFolder,
  }
  if (data._id !== undefined) result.id = data._id
  return result
}

export const importPredefinedItemsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: PredefinedItemsXML | undefined
): PredefinedItems | undefined => {
  if (!data) return undefined

  return data.map((value) => importPredefinedFromXML(context, undefined, value)!)
}

/**
 * Обработчик importFromXML для типа "Predefined".
 * Получает содержимое контейнера (например, содержимое тега <PredefinedData>):
 * { Item: PredefinedXML | PredefinedXML[] }
 */
export const importPredefinedItemsFromContainerXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  containerContent: Record<string, any> | undefined
): PredefinedItems | undefined => {
  if (!containerContent) return undefined
  const rawItems = containerContent.Item
  if (rawItems === undefined) return []
  const items: PredefinedXML[] = Array.isArray(rawItems) ? rawItems : [rawItems]
  return items.map((item) => importPredefinedFromXML(context, undefined, item)!).filter(Boolean)
}

registerTypeRule("Predefined", "importFromXML", importPredefinedItemsFromContainerXML)
