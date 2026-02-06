import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Events, EventsXML, EventXML } from "./types"

function toPascalCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** @deprecated */
export const exportEventsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Events | undefined
): EventsXML | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const events: EventXML[] = Object.entries(data)
    .map(([eventName, eventValue]) => ({
      _name: toPascalCase(eventName),
      "#text": eventValue,
    }))
    .sort((a, b) => a._name.localeCompare(b._name))

  return {
    Event: events.length === 1 ? events[0] : events,
  }
}
