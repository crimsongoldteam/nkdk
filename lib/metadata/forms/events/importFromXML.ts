import { Context } from "../../context/types"
import { Events, EventsXML } from "./types"

function toCamelCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const importEventsFromXML = (
  _configurationSettings: Context,
  xml: EventsXML | undefined
): Events | undefined => {
  if (!xml || xml.length === 0) return undefined

  const events: Events = {}

  for (const event of xml) {
    const eventName = toCamelCase(event.Event._name)
    const eventValue = event.Event["#text"] ?? ""
    events[eventName] = eventValue
  }

  return Object.keys(events).length > 0 ? events : undefined
}
