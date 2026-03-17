import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { EventsXML, EventXML } from "./types"

export const exportEventsToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: unknown,
  _referenceValue?: unknown
): EventsXML | undefined => {
  if (!value || typeof value !== "object") return undefined

  const dataEvents = value as Record<string, string>
  const items: EventXML[] = []

  const referenceEvents = _referenceValue && typeof _referenceValue === "object" ? (_referenceValue as Record<string, unknown>) : undefined

  const orderedKeys: string[] = []

  if (referenceEvents) {
    // сначала ключи в порядке, заданном референсным значением
    for (const key of Object.keys(referenceEvents)) {
      if (key in dataEvents) {
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
    const eventValue = dataEvents[key]
    if (eventValue === undefined) continue
    items.push({ _name: capitalize(key), "#text": eventValue })
  }

  if (items.length === 0) return undefined

  return { Event: items }
}

registerTypeRule("Events", "exportToXML", exportEventsToXML)
