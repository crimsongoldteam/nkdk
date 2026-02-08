import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { SingleElement } from "~/metadata/forms/collections/childItems/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML, EventXML } from "~/metadata/forms/events/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementRule, getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule } from "../typeRulesFactory"
import { ElementXML } from "../types"

export function exportElementToXML<T extends NamedElement>(params: {
  context: ConfigurationContext
  element: T | undefined
}): ElementXML | undefined {
  const { element, context } = params

  if (element === undefined) return undefined

  const name = element.name
  const id = getElementId(context)
  const rule = getElementRule<T>(element.elementType)

  if (!rule) throw new Error(`Unknown element type: ${element.elementType}`)

  return exportToXML<T>({ context, element, rule, id, name })
}

export function exportSingleElementToXML<T extends SingleElement>(params: {
  context: ConfigurationContext
  element: T | undefined
  rule: ElementRule<T>
  id: string
  name: string
}): ElementXML {
  const { element, context, rule, id, name } = params
  return exportToXML<T>({ context, element, rule, id, name })
}

function exportToXML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
  rule: ElementRule<T>
  id: string
  name: string
}): any {
  const { context, element: data, rule, id, name } = params

  const result: any = {
    _name: name,
    _id: id,
  }

  const currentContext: ConfigurationContext = {
    ...context,
    elementContext: { name: name },
  }

  for (const [key, ruleProp] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
    const value = (data as any)[key]

    const xmlKey = ruleProp.xml ?? capitalize(key)

    const typeExportFn = ruleProp.type ? getTypeRule(ruleProp.type, "exportToXML") : undefined

    if (!typeExportFn) {
      if (value !== undefined && value !== ruleProp.defaultValue) {
        result[xmlKey] = value
      }
      continue
    }

    const exportedValue = typeExportFn(currentContext, ruleProp, value)
    if (exportedValue !== undefined && exportedValue !== ruleProp.defaultValue) {
      result[xmlKey] = exportedValue
    }
  }

  const events = mapEventsToXML(
    context,
    rule.events,
    data && "events" in data
      ? ((data as Record<string, unknown>).events as Record<string, string> | undefined)
      : undefined
  )
  Object.assign(result, events)

  return sortObject(result)
}

function mapEventsToXML(
  _context: ConfigurationContext,
  rulesEvents: Record<string, string> | undefined,
  dataEvents: Record<string, string> | undefined
): { Events?: EventsXML } {
  if (!rulesEvents || !dataEvents || Object.keys(dataEvents).length === 0) {
    return {}
  }

  const events: EventXML[] = []

  for (const ruleKey of Object.keys(rulesEvents)) {
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
