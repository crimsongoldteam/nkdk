import type { ConfigurationContextFromXML } from "../../context/types"
import type { ConfigurationIndexValueFromXMLDescriptor } from "../../orchestration/property/fn"
import type { PropertyRule } from "../../orchestration/property/types"
import { getConfigurationIndexCollectionContext } from "./context"

export function collectConfigurationIndexIdentityFromXML(params: {
  context: ConfigurationContextFromXML
  sourceXmlKey: string | undefined
  xmlValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || typeof params.xmlValue !== "string") return

  if (params.sourceXmlKey === "_uuid") {
    collection.collector.setUuid(collection.logicalAddress, params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_id") {
    collection.collector.setXmlId(collection.logicalAddress, params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_name" && !isNameReconstructible(collection.logicalAddress, params.xmlValue)) {
    collection.collector.setXmlName(collection.logicalAddress, params.xmlValue)
  }
}

export function collectConfigurationIndexPropertyFromXML(params: {
  context: ConfigurationContextFromXML
  propertyKey: string
  xmlValue: unknown
  rule: PropertyRule
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return

  const address = `${collection.logicalAddress}.${params.propertyKey}`
  if (params.descriptor?.userSettingsIdFromSource === true && typeof params.xmlValue === "string") {
    collection.collector.setUserSettingsId(address, params.xmlValue)
  }
  if (
    params.descriptor?.xsiNilWhenNotRepresentable === true &&
    hasXsiNil(params.xmlValue) &&
    !ruleRepresentsXsiNil(params.rule)
  ) {
    collection.collector.setXsiNil(address)
  }
}

export function collectConfigurationIndexImportedValue(params: {
  context: ConfigurationContextFromXML
  propertyKey: string
  importedValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || !isRecord(params.importedValue)) return

  const xmlPrefix = params.importedValue.xmlPrefix
  if (typeof xmlPrefix === "string") {
    collection.collector.setXmlPrefix(`${collection.logicalAddress}.${params.propertyKey}`, xmlPrefix)
  }
}

function isNameReconstructible(logicalAddress: string, xmlName: string): boolean {
  const lastSegment = logicalAddress.slice(logicalAddress.lastIndexOf(".") + 1)
  return !/^.+\[\d+\]$/.test(lastSegment) || lastSegment === xmlName
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function hasXsiNil(value: unknown): boolean {
  if (!isRecord(value)) return false
  return value["_xsi:nil"] === true || value["_xsi:nil"] === "true"
}

function ruleRepresentsXsiNil(rule: PropertyRule): boolean {
  if ("exportNilValue" in rule && rule.exportNilValue === true) return true
  return hasXsiNil(rule.defaultValueXMLRaw)
}
