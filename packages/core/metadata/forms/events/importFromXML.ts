import { camelCase } from "change-case"
import { Context } from "../../context/types"
import { Events, EventsXML } from "./types"

export const importEventsFromXML = (_context: Context, xml: EventsXML | undefined): Events | undefined => {
  if (!xml) return undefined

  const events = Array.isArray(xml.Event) ? xml.Event : [xml.Event]

  const result: Events = {}

  for (const event of events) {
    const eventName = camelCase(event._name)
    const eventValue = event["#text"] ?? ""
    result[eventName] = eventValue
  }

  return result
}
