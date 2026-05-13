import { getChildContextToXML } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ToMetadata } from ".."
import { exportPropertiesToXML } from "../property/toXML"
import { XML_SOURCE_KEYS } from "../property/helpers"
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
    additionalParams: { name },
  })
}

export function exportSingleElementToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextWithExportToXML
  element: ToMetadata<Rule["itemType"]> | undefined
  referenceElement?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  additionalParams: { name: string; id?: string }
}): ElementXMLWithoutId {
  return exportToXML(params)
}

function exportToXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextWithExportToXML
  element: ToMetadata<Rule["itemType"]> | undefined
  referenceElement?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  additionalParams: { name: string; id?: string }
}): ElementXMLWithoutId {
  const { context, element, referenceElement, rule, additionalParams } = params
  const { name } = additionalParams
  const itemType = rule.itemType

  const currentContext: ConfigurationContextWithExportToXML = getChildContextToXML({
    context,
    itemType,
    path: "",
    name,
  })

  const result: ElementXMLWithoutId = {
    _name: name,
    ...(additionalParams.id ? { _id: additionalParams.id } : { _id: "" }),
  }

  context.exportToXML?.context?.metadataForNumbering.push({
    element,
    referenceElement: referenceElement,
    xmlElement: result,
  })

  const properties = exportPropertiesToXML({
    context: currentContext,
    metadata: element,
    referenceMetadata: referenceElement,
    rule: rule,
  })

  Object.assign(result, properties)
  removeSyntheticEmptyTitle(result, referenceElement)

  return result
}

function removeSyntheticEmptyTitle(result: ElementXMLWithoutId, referenceElement: unknown): void {
  if (referenceElement !== undefined && hasXMLSourceKey(referenceElement, "title")) return
  const title = (result as { Title?: unknown }).Title
  if (!isEmptyI8nTextXML(title)) return
  delete (result as { Title?: unknown }).Title
}

function hasXMLSourceKey(value: unknown, key: string): boolean {
  if (value === null || value === undefined || typeof value !== "object") return false
  const sourceKeys = (value as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
  return sourceKeys !== null && sourceKeys !== undefined && typeof sourceKeys === "object" && Object.prototype.hasOwnProperty.call(sourceKeys, key)
}

function isEmptyI8nTextXML(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value !== "object") return false
  if ((value as { _formatted?: unknown })._formatted === true) return false
  const item = (value as { "v8:item"?: unknown })["v8:item"]
  if (Array.isArray(item)) return item.every(isEmptyI8nTextItem)
  return isEmptyI8nTextItem(item)
}

function isEmptyI8nTextItem(value: unknown): boolean {
  if (value === undefined || value === null || typeof value !== "object") return false
  const content = (value as { "v8:content"?: unknown })["v8:content"]
  return content === undefined || content === ""
}

// Moved to ../events/mapEventsToXML.ts
