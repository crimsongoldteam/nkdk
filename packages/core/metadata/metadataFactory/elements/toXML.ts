import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML, EventXML } from "~/metadata/forms/events/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementRule, getElementRule } from "../elementRulesFactory"
import { FormElementType } from "../metadataType/types"
import { exportPropertiesToXML } from "../properties/toXML"
import { ElementXML } from "../types"

// export const exportPropertyToXML = (params: {
//   context: ConfigurationContext
//   rule: PropertyRule<any>
//   value: any
// }): any | undefined => {
//   const { context, rule, value } = params

//   const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToXML") : undefined

//   if (!typeExportFn) {
//     if (value === rule.defaultValue) {
//       return undefined
//     }
//     return value
//   }

//   const exportedValue = typeExportFn(context, rule, value)
//   if (exportedValue === rule.defaultValue) {
//     return undefined
//   }
//   return exportedValue
// }

export function exportElementToXML<T extends NamedElement>(params: {
  context: ConfigurationContext
  element: T
}): ElementXML | undefined {
  const { element, context } = params

  if (element === undefined) return undefined

  const name = element.name
  const id = getElementId(context)
  const rule = getElementRule<T>(element.itemType)

  if (!rule) throw new Error(`Unknown element type: ${element.itemType}`)

  return exportToXML<T>({
    context,
    itemType: element.itemType,
    element,
    rule,
    id,
    name,
  })
}

export function exportSingleElementToXML<T extends BaseElement>(params: {
  context: ConfigurationContext
  element: T | undefined
  rule: ElementRule<T>
  id: string
  name: string
  itemType: FormElementType
}): ElementXML {
  return exportToXML<T>(params)
}

function exportToXML<T extends BaseElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  element: T | undefined
  rule: ElementRule<T>
  id: string
  name: string
}): ElementXML {
  const { context, element, rule, id, name, itemType } = params

  const elementsTree: ConfigurationContext["elementsTree"] = []
  if (context.elementsTree !== undefined) {
    elementsTree.push(...context.elementsTree)
  }

  elementsTree.push({ name: name, itemType: itemType })

  const currentContext: ConfigurationContext = {
    ...context,
    elementsTree: elementsTree,
  }

  const properties = exportPropertiesToXML({
    context: currentContext,
    metadataItem: element,
    rule: rule,
  })

  // for (const [key, ruleProp] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
  //   const value = element === undefined ? undefined : (element as any)[key]

  //   const xmlKey = ruleProp.xml ?? capitalize(key)

  //   const elementsTree: ConfigurationContext["elementsTree"] = []

  //   if (context.elementsTree !== undefined) {
  //     elementsTree.push(...context.elementsTree)
  //   }

  //   elementsTree.push({ name: name, itemType: itemType })

  //   const currentContext: ConfigurationContext = {
  //     ...context,
  //     elementsTree: elementsTree,
  //   }

  //   const exportedValue = exportPropertyToXML({
  //     context: currentContext,
  //     rule: ruleProp,
  //     value,
  //   })

  //   if (exportedValue === undefined) continue
  //   result[xmlKey] = exportedValue
  // }

  const events = mapEventsToXML(
    context,
    rule.events,
    element && "events" in element
      ? ((element as Record<string, unknown>).events as Record<string, string> | undefined)
      : undefined
  )

  const result: ElementXML = {
    _name: name,
    _id: id,
    ...properties,
    ...events,
  }

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
