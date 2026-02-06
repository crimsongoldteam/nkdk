import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { EventedElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML, EventXML } from "~/metadata/forms/events/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementRule } from "../elementRulesFactory"
import { getTypeRule } from "../typeRulesFactory"
import { FormElementType, ToXMLType } from "../types"

export function exportElementToXML<T extends NamedElement | EventedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToXMLType<T> | undefined {
  if (data === undefined) return undefined

  const baseFields = exportElementPropsToXML(context, undefined, { name: data.name })

  const result: any = {
    ...baseFields,
  }

  const rules = getElementRule<T>(elementType)

  for (const [key, rule] of Object.entries(rules.properties)) {
    const value = (data as any)[key]

    if (value === undefined) continue

    const xmlKey = rule.xml ?? capitalize(key)

    const typeExportFn = getTypeRule(rule.type, "exportToXML")

    if (!typeExportFn) {
      result[xmlKey] = value
      continue
    }

    const currentContext: ConfigurationContext = {
      ...context,
      elementContext: data,
    }

    const exportedValue = typeExportFn(currentContext, rule, value)
    if (exportedValue !== undefined) {
      result[xmlKey] = exportedValue
    }
  }

  const events = mapEventsToXML(context, rules.events, "events" in data ? data.events : undefined)
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
