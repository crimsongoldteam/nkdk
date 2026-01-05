import { pascalCase } from "change-case"
import { Context } from "../../context/types"
import { Events, EventsXML, EventXML } from "./types"

export const exportEventsToXML = (_context: Context, data: Events | undefined): EventsXML | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const events: EventXML[] = Object.entries(data).map(([eventName, eventValue]) => ({
    _name: pascalCase(eventName),
    "#text": eventValue,
  }))

  return {
    Event: events.length === 1 ? events[0] : events,
  }
}
