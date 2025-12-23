import { ConfigurationSettings } from "../../configurationSettings/types"
import { Events, EventsEnterprise } from "./types"

export const exportEventsToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: Events | undefined
): EventsEnterprise | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const events: EventsEnterprise = {}

  for (const [eventName, eventValue] of Object.entries(data)) {
    events[eventName] = eventValue
  }

  return events
}
