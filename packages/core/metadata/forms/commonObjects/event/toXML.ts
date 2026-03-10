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

  for (const [key, eventValue] of Object.entries(dataEvents)) {
    if (eventValue === undefined) continue
    items.push({ _name: capitalize(key), "#text": eventValue })
  }

  if (items.length === 0) return undefined

  const sorted = items.sort((a, b) => a._name.localeCompare(b._name))
  return { Event: sorted }
}

registerTypeRule("Events", "exportToXML", exportEventsToXML)
