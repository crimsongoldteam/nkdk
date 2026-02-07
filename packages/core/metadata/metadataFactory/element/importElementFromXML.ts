import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { Events, EventsXML } from "~/metadata/forms/events/types"
import { getElementRule } from "../elementRulesFactory"
import { FormElementType, ToXMLType } from "../types"
import { importPropertyFromXML } from "./importPropertyFromXML"

export function importElementFromXML<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  xml: ToXMLType<T> | undefined
): T | undefined {
  if (xml === undefined) return undefined

  const baseFields = importBaseElementFromXML(context, undefined, xml as any)

  const result: T = {
    ...baseFields,
    elementType: elementType as any,
  } as T

  const rules = getElementRule<T>(elementType)

  for (const [key, rule] of Object.entries(rules.properties)) {
    const xmlKey = rule.xml ?? capitalize(key)

    const xmlValue = (xml as any)[xmlKey]

    const value = importPropertyFromXML(context, rule, xmlValue)

    if (value === undefined) continue
    ;(result as any)[key] = value
  }

  const events = importEventsFromXML(rules.events, (xml as any).Events)
  Object.assign(result, events)

  return result
}

const importEventsFromXML = <T extends EventedElement>(
  rulesEvents: T["events"],
  xml: EventsXML | undefined
): { events?: Events } => {
  if (!xml || !rulesEvents) return {}

  const events = Array.isArray(xml.Event) ? xml.Event : [xml.Event]

  const result: Events = {}
  for (const key of Object.keys(rulesEvents)) {
    const xmlKey = capitalize(key)
    const xmlEvent = events.find((e) => e._name === xmlKey)

    if (!xmlEvent) continue
    const eventValue = xmlEvent["#text"]
    result[key] = eventValue
  }

  return { events: result }
}
