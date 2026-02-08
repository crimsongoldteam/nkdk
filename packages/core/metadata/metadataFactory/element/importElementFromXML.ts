import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { SingleElement } from "~/metadata/forms/collections/childItems/types"
import { EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { Events, EventsXML } from "~/metadata/forms/events/types"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule } from "../typeRulesFactory"
import { ElementXML, FormElementType } from "../types"

export const importSingleElementFromXML = <T extends SingleElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  xml: ElementXML
): T | undefined => {
  const rules = getElementRule(elementType)

  const props = importFromXML(context, xml, rules)

  const result = {
    elementType: elementType,
    ...(props ?? {}),
  }

  return result as T | undefined
}

export function importElementFromXML<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  xml: ElementXML | undefined
): T | undefined {
  if (xml === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const props = importFromXML(context, xml, rules)

  const result = {
    name: xml._name,
    elementType: elementType,
    ...props,
  } as T

  return result
}

export function importFromXML<T extends NamedElement>(
  context: ConfigurationContext,
  xml: any,
  rules: ElementRule<T>
): Partial<T> | undefined {
  const result: Partial<T> = {}
  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
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

const importPropertyFromXML = (context: ConfigurationContext, propertyRule: PropertyRule<any>, data: any): any => {
  const ruleFunction = getTypeRule(propertyRule.type as any, "importFromXML")

  if (ruleFunction === undefined) return data

  const result = ruleFunction(context, propertyRule, data)

  return result
}
