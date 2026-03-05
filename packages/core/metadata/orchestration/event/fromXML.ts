import { capitalize } from "~/helpers/capitalize"
import { MetadataItemRule, MetadataItemTypeToMdItem } from ".."
import { ElementXML } from "../formElement/types"
import { Events } from "./types"

export const importEventsFromXML = <Rule extends MetadataItemRule>(
  metadataRule: Rule,
  xml: ElementXML | undefined
): Extract<MetadataItemTypeToMdItem<Rule["itemType"]>, { events?: Events }> | {} => {
  if (!xml || !metadataRule.events || !("Events" in xml)) return {}

  const eventsXML = xml.Events

  const eventRule = metadataRule.events

  const events = Array.isArray(eventsXML.Event) ? eventsXML.Event : [eventsXML.Event]

  const result: Events = {}
  for (const key of Object.keys(eventRule)) {
    const xmlKey = capitalize(key)
    const xmlEvent = events.find((e: { _name: string }) => e._name === xmlKey)

    if (!xmlEvent) continue
    const eventValue = xmlEvent["#text"]
    result[key] = eventValue
  }

  return { events: result }
}
