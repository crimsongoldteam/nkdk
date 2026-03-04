import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, EventedElement } from "~/metadata/forms/elements/baseElement/types"
import {
  ElementRule,
  ElementXML,
  Events,
  EventsXML,
  FormElementType,
  importPropertiesFromXML,
  MetadataItemTypeToMdItem,
  SingleFormElementType,
} from "~/metadata/orchestration"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"

export const importSingleElementFromXML = <Type extends SingleFormElementType>(params: {
  context: ConfigurationContext
  rule: ElementRule
  itemType: Type
  xml: ElementXML
}): MetadataItemTypeToMdItem<Type> | undefined => {
  const { context, rule, xml, itemType } = params

  const props = importFromXML(context, xml, rule)

  if (props === undefined) return undefined

  const result = {
    itemType: itemType,
    ...(props ?? {}),
  } as T

  if (isEmptyMetadataItem({ context, rule, element: result })) return undefined

  return result
}

export function importElementFromXML<Type extends FormElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  xml: ElementXML | undefined
}): MetadataItemTypeToMdItem<Type> | undefined {
  const { context, itemType, xml } = params

  if (xml === undefined) return undefined

  const rules = getElementRule(itemType)

  const props = importFromXML(context, xml, rules)

  const result: MetadataItemTypeToMdItem<Type> = {
    name: xml._name,
    itemType: itemType,
    ...props,
  }

  return result
}

export function importFromXML<T extends BaseElement>(
  context: ConfigurationContext,
  xml: any,
  rules: ElementRule
): Partial<T> | undefined {
  if (xml === undefined) return undefined

  const properties = importPropertiesFromXML({ context, xml, rule: rules })

  const events = importEventsFromXML(rules.events, (xml as any).Events)

  return {
    ...properties,
    ...events,
  } as Partial<T>
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
    const xmlEvent = events.find((e: { _name: string }) => e._name === xmlKey)

    if (!xmlEvent) continue
    const eventValue = xmlEvent["#text"]
    result[key] = eventValue
  }

  return { events: result }
}
