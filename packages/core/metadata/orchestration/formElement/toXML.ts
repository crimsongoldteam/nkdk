import { getChildContextToXML } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ToMetadata } from ".."
import { exportEventsToXML } from "../event"
import { exportPropertiesToXML } from "../property/toXML"
import { getElementRule } from "./ruleFactory"
import { ElementRule, ElementXMLWithoutId } from "./types"

export function exportElementToXML<T extends NamedElement>(params: {
  context: ConfigurationContextWithExportToXML
  element: T
  referenceElement?: T
}): ElementXMLWithoutId | undefined {
  const { element, context, referenceElement } = params

  if (element === undefined) return undefined

  const name = element.name
  const rule = getElementRule(element.itemType)

  return exportToXML({
    context,
    element: element as ToMetadata<typeof rule.itemType>,
    referenceElement: referenceElement as ToMetadata<typeof rule.itemType> | undefined,
    rule,
    name,
  })
}

export function exportSingleElementToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextWithExportToXML
  element: ToMetadata<Rule["itemType"]> | undefined
  referenceElement?: ToMetadata<Rule["itemType"]> | undefined
  rule: ElementRule
  name: string
}): ElementXMLWithoutId {
  return exportToXML(params)
}

function exportToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextWithExportToXML
  element: ToMetadata<Rule["itemType"]> | undefined
  referenceElement?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  name: string
}): ElementXMLWithoutId {
  const { context, element, referenceElement, rule, name } = params
  const itemType = rule.itemType

  const currentContext: ConfigurationContextWithExportToXML = getChildContextToXML({
    context,
    itemType,
    path: "",
    name,
  })

  const properties = exportPropertiesToXML({
    context: currentContext,
    metadata: element,
    referenceMetadata: referenceElement,
    rule: rule,
  })

  const eventsResult = exportEventsToXML({
    context,
    rule,
    data: element,
  })

  const result: ElementXMLWithoutId = {
    _name: name,
    ...properties,
    ...eventsResult,
  }

  context.exportToXML?.context?.elementsMap.push({
    element,
    referenceElement: referenceElement,
    xmlElement: result,
  })

  return result
}

// Moved to ../events/mapEventsToXML.ts
