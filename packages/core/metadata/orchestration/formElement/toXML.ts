import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { MetadataItemTypeToMdItem } from ".."
import { exportEventsToXML } from "../event"
import { exportPropertiesToXML } from "../property/toXML"
import { getElementRule } from "./ruleFactory"
import { ElementRule, ElementXML } from "./types"

export function exportElementToXML<T extends NamedElement>(params: {
  context: ConfigurationContext
  element: T
}): ElementXML | undefined {
  const { element, context } = params

  if (element === undefined) return undefined

  const name = element.name
  const id = getElementId(context)
  const rule = getElementRule(element.itemType)

  return exportToXML({
    context,
    element: element as MetadataItemTypeToMdItem<typeof rule.itemType>,
    rule,
    id,
    name,
  })
}

export function exportSingleElementToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  element: MetadataItemTypeToMdItem<Rule["itemType"]> | undefined
  rule: ElementRule
  id: string
  name: string
}): ElementXML {
  return exportToXML(params)
}

function exportToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  element: MetadataItemTypeToMdItem<Rule["itemType"]> | undefined
  rule: Rule
  id: string
  name: string
}): ElementXML {
  const { context, element, rule, id, name } = params
  const itemType = rule.itemType

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

  const eventsResult = exportEventsToXML({
    context,
    rule,
    data: element,
  })

  const result: ElementXML = {
    _name: name,
    _id: id,
    ...properties,
    ...eventsResult,
  }

  return sortObject(result)
}

// Moved to ../events/mapEventsToXML.ts
