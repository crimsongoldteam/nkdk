import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItem, MetadataItemRule } from "../property/types"
import { EventsXML, Events, EventXML } from "./types"

export const exportEventsToXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  data: T | undefined
}): { Events?: EventsXML } => {
  const { rule, data } = params

  if (!rule.events) return {}
  if (!data) return {}
  if (!("events" in data)) return {}

  const dataEvents = data.events as Events
  const ruleEvents = rule.events

  const events: EventXML[] = []

  for (const ruleKey of Object.keys(ruleEvents)) {
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
