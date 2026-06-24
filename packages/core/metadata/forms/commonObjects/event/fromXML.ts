import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { EventsXML } from "./types"

const isNonEmptyObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value as object).length > 0
}

export const importEventsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: unknown
): Record<string, string> | undefined => {
  if (!value || typeof value !== "object") return undefined

  const eventsXML = value as EventsXML
  const events = Array.isArray(eventsXML.Event) ? eventsXML.Event : [eventsXML.Event]

  const result: Record<string, string> = {}
  for (const event of events) {
    if (!event || typeof event !== "object") continue
    const name = (event as any)._name as string | undefined
    const text = (event as any)["#text"] as string | undefined
    if (!name || text === undefined) continue

    const key = name.length > 0 ? name[0].toLowerCase() + name.slice(1) : name
    result[key] = text
  }

  return isNonEmptyObject(result) ? result : undefined
}

registerTypeRule("Events", "importFromXML", importEventsFromXML)
