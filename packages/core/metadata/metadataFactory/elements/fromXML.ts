import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { Events, EventsXML } from "~/metadata/metadataFactory/events/types"
import { FormElementType } from "../metadataType/types"
import { importPropertiesFromXML } from "../properties/fromXML"
import { ElementXML } from "../types"
import { getElementRule } from "./factory"
import { isEmptyMetadataItem } from "./helper"
import { ElementRule } from "./types"

export const importSingleElementFromXML = <T extends BaseElement>(params: {
  context: ConfigurationContext
  rule: ElementRule<T>
  itemType: FormElementType
  xml: ElementXML
}): T | undefined => {
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
