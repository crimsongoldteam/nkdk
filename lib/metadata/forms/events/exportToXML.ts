import { TEvents, TEventsXML, TEventXML } from "./types"

function toPascalCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const exportEventsToXML = (data: TEvents | undefined): TEventsXML | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const events: TEventXML[] = Object.entries(data)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      _name: toPascalCase(key),
      "#text": value,
    }))

  if (events.length === 0) return undefined

  return {
    Event: events.length === 1 ? events[0] : events,
  }
}

