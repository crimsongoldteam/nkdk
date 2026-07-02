import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { EventsXML, EventXML } from "./types"

const isEventsPropertyRule = (rule: PropertyRule): rule is PropertyRule & { items: Record<string, string> } => {
  return rule.type === "Events"
}

export const exportEventsToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: unknown,
  _referenceValue?: unknown
): EventsXML | undefined => {
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Record<string, string>
  const items: EventXML[] = []

  const referenceEvents = _referenceValue && typeof _referenceValue === "object" ? (_referenceValue as Record<string, string>) : undefined
  const knownEventKeys = isEventsPropertyRule(_rule) ? new Set(Object.keys(_rule.items)) : new Set<string>()

  const orderedKeys: string[] = []

  if (referenceEvents) {
    // сначала ключи в порядке, заданном референсным значением
    for (const key of Object.keys(referenceEvents)) {
      if (key in dataEvents) {
        orderedKeys.push(key)
      } else if (!knownEventKeys.has(key)) {
        orderedKeys.push(key)
      }
    }

    // затем остальные ключи, которых нет в референсе, отсортированные по алфавиту
    const restKeys = Object.keys(dataEvents)
      .filter((key) => !orderedKeys.includes(key))
      .sort((a, b) => a.localeCompare(b))

    orderedKeys.push(...restKeys)
  } else {
    // если референса нет, сохраняем текущую логику: сортировка по имени
    orderedKeys.push(...Object.keys(dataEvents).sort((a, b) => a.localeCompare(b)))
  }

  for (const key of orderedKeys) {
    const eventValue = dataEvents[key] ?? referenceEvents?.[key]
    if (eventValue === undefined) continue
    const xmlName = referenceEvents !== undefined && key in referenceEvents && !knownEventKeys.has(key) ? key : capitalize(key)
    items.push({ _name: xmlName, "#text": eventValue })
  }

  if (items.length === 0) return undefined

  return { Event: items }
}

registerTypeRule("Events", "exportToXML", exportEventsToXML)
