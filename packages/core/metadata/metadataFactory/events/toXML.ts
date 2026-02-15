import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { EventsXML, EventXML } from "~/metadata/metadataFactory/events/types"

export const exportEventsToXML = (
  _context: ConfigurationContext,
  rulesEvents: Record<string, string> | undefined,
  dataEvents: Record<string, string> | undefined
): { Events?: EventsXML } => {
  if (!rulesEvents || !dataEvents || Object.keys(dataEvents).length === 0) {
    return {}
  }

  const events: EventXML[] = []

  for (const ruleKey of Object.keys(rulesEvents)) {
    const eventName = capitalize(ruleKey)
    const eventValue = dataEvents[ruleKey]
    if (eventValue === undefined) continue

    events.push({ _name: eventName, "#text": eventValue })
  }

  if (events.length === 0) {
    return {}
  }

  const sortedEvents = events.sort((a, b) => a._name.localeCompare(b._name))

  return { Events: { Event: sortedEvents } }
}
