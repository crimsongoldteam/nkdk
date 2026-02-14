import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { SingleElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement, EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { Events, EventsXML } from "~/metadata/forms/events/types"
import { ElementRule, getElementRule } from "../elementRulesFactory"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { getTypeRule } from "../typeRulesFactory"
import { ElementXML } from "../types"
import { isEmptyElement } from "./helper"

export const importPropertyFromXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any
}): any => {
  const { context, rule, value } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromXML") : undefined

  if (!typeImportFn) {
    return value
  }

  const result = typeImportFn(context, rule, value)

  return result
}

export const importSingleElementFromXML = <T extends SingleElement>(params: {
  context: ConfigurationContext
  rule: ElementRule<T>
  itemType: FormElementType
  xml: ElementXML
}): T | undefined => {
  const { context, rule, xml, itemType } = params

  const props = importFromXML(context, xml, rule)

  const result = {
    itemType: itemType,
    ...(props ?? {}),
  }
  if (isEmptyElement(result)) return undefined

  return result as T | undefined
}

export function importElementFromXML<T extends NamedElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  xml: ElementXML | undefined
}): T | undefined {
  const { context, itemType, xml } = params

  if (xml === undefined) return undefined

  const rules = getElementRule<T>(itemType)

  const props = importFromXML(context, xml, rules)

  const result = {
    name: xml._name,
    itemType: itemType,
    ...props,
  } as T

  return result
}

export function importFromXML<T extends BaseElement>(
  context: ConfigurationContext,
  xml: any,
  rules: ElementRule<T>
): Partial<T> | undefined {
  const result: Partial<T> = {}
  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    if (rule.fromXML === false) continue
    const xmlKey = rule.xml ?? capitalize(key)

    const xmlValue = (xml as any)[xmlKey]

    const value = importPropertyFromXML({ context, rule, value: xmlValue })

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
