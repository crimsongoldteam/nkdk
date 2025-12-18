import { ConfigurationSettings } from "../../configurationSettings/types"
import { Events, EventsXML } from "./types"

function toPascalCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const exportEventsToXML = (
  data: Events | undefined,
  _configurationSettings: ConfigurationSettings
): EventsXML | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const events: EventsXML = Object.entries(data).map(([eventName, eventValue]) => {
    return {
      Event: {
        _name: toPascalCase(eventName),
        "#text": eventValue ?? "",
      },
    }
  })
  return events.length > 0 ? events : undefined
}
