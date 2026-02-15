import { capitalize } from "~/helpers/capitalize"
import { Events, EventsXML } from "~/metadata/metadataFactory/events/types"

export const importEventsFromXML = <T extends { events?: Record<string, string> }>(
  rulesEvents: T["events"],
  xml: EventsXML | undefined
): { events?: Events } => {
  if (!xml || !rulesEvents) return {}

  const events = Array.isArray(xml.Event) ? xml.Event : [xml.Event]

  const result: Events = {}
  for (const key of Object.keys(rulesEvents)) {
    const xmlKey = capitalize(key)
    const xmlEvent = events.find((e: { _name: string }) => e._name === xmlKey)

    if (!xmlEvent) continue
    const eventValue = xmlEvent["#text"]
    result[key] = eventValue
  }

  return { events: result }
}
