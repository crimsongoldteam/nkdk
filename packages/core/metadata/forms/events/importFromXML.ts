import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Events, EventsXML } from "./types"

function toCamelCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const importEventsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: EventsXML | undefined
): Events | undefined => {
  if (!xml) return undefined

  const events = Array.isArray(xml.Event) ? xml.Event : [xml.Event]

  const result: Events = {}

  for (const event of events) {
    const eventName = toCamelCase(event._name)
    const eventValue = event["#text"]
    result[eventName] = eventValue
  }

  return result
}
