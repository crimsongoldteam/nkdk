import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const exportPredefinedToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Predefined | undefined
): PredefinedXML | undefined => {
  if (!data) return undefined

  const result: PredefinedXML = {
    Name: data.name,
    Code: data.code,
    Description: data.description,
    IsFolder: data.isFolder,
  }
  if (data.id !== undefined) result._id = data.id
  return result
}

export const exportPredefinedItemsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItems | undefined
): PredefinedItemsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportPredefinedToXML(context, undefined, value)!)
}

/**
 * Обработчик exportToXML для типа "Predefined".
 * Возвращает содержимое контейнера: { Item: PredefinedXML | PredefinedXML[] }
 * Корневые атрибуты (xmlns и т.п.) добавляет оркестратор.
 */
export const exportPredefinedItemsToContainerXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PredefinedItems | undefined
): { Item: PredefinedXML[] } | undefined => {
  if (!data || data.length === 0) return undefined
  return { Item: data.map((item) => exportPredefinedToXML(context, undefined, item)!) }
}

registerTypeRule("Predefined", "exportToXML", exportPredefinedItemsToContainerXML)
