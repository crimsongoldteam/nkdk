import { TEventsXML, TEvents } from "./types"

function toCamelCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const importEventsFromXML = (xml: TEventsXML | undefined): TEvents | undefined => {
  if (!xml || !xml.Event) return undefined

  const events: TEvents = {}
  
  const eventArray = Array.isArray(xml.Event) ? xml.Event : [xml.Event]
  
  for (const event of eventArray) {
    if (event._name) {
      const eventName = toCamelCase(event._name)
      const eventValue = event["#text"] ?? ""
      events[eventName] = eventValue
    }
  }

  return Object.keys(events).length > 0 ? events : undefined
}

