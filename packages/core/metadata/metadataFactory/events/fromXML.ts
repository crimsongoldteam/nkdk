import { capitalize } from "~/helpers/capitalize"
import { Events } from "~/metadata/metadataFactory/events/types"

export const importEventsFromXML = <T extends { events?: Record<string, string> }>(
  rule: T,
  xml: any
): { events?: Events } => {
  if (!xml || !rule) return {}
  if (!("Event" in xml)) return {}

  const events = Array.isArray(xml.Event) ? xml.Event : [xml.Event]

  const result: Events = {}
  for (const key of Object.keys(rule.events ?? {})) {
    const xmlKey = capitalize(key)
    const xmlEvent = events.find((e: { _name: string }) => e._name === xmlKey)

    if (!xmlEvent) continue
    const eventValue = xmlEvent["#text"]
    result[key] = eventValue
  }

  return { events: result }
}
