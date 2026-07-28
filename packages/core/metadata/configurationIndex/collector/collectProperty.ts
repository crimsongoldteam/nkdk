import type { ConfigurationContextFromXML } from "../../context/types"
import { isDeepStrictEqual } from "node:util"
import type { ConfigurationIndexValueFromXMLDescriptor } from "../../orchestration/property/fn"
import type { PropertyRule } from "../../orchestration/property/types"
import { getConfigurationIndexCollectionContext } from "./context"

export function collectConfigurationIndexIdentityFromXML(params: {
  context: ConfigurationContextFromXML
  sourceXmlKey: string | undefined
  xmlValue: unknown
  reconstructibleXmlName?: string
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || typeof params.xmlValue !== "string") return

  if (params.sourceXmlKey === "_uuid") {
    collection.collector.setUuid(collection.logicalAddress, params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_id") {
    if (params.descriptor?.identityKind === "uuid") {
      collection.collector.setUuid(collection.logicalAddress, params.xmlValue)
    } else {
      collection.collector.setXmlId(collection.logicalAddress, params.xmlValue)
    }
    return
  }
  if (
    params.sourceXmlKey === "_name" &&
    !isNameReconstructible(collection.logicalAddress, params.xmlValue, params.reconstructibleXmlName)
  ) {
    if (params.xmlValue.length === 0) collection.collector.setAlias(collection.logicalAddress, "_name", "")
    else collection.collector.setXmlName(collection.logicalAddress, params.xmlValue)
  }
}

export function collectConfigurationIndexPropertyFromXML(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  xmlValue: unknown
  rule: PropertyRule
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return

  const address = params.logicalAddress ?? `${collection.logicalAddress}.${params.propertyKey}`
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
  if (params.descriptor?.xsiTypeWhenNotRepresentable === true) {
    const xsiType = getUnrepresentedXsiType(params.xmlValue)
    if (xsiType !== undefined) collection.collector.setXsiType(address, xsiType)
  }
  if (
    Object.prototype.hasOwnProperty.call(params.rule, "defaultValueXMLEmpty") &&
    (params.xmlValue === undefined || params.xmlValue === "") &&
    !isDeepStrictEqual(params.rule.defaultValueXMLEmpty, params.xmlValue)
  ) {
    collection.collector.setExplicitEmpty(address)
  }
  const ambiguousScalar = ambiguousImplicitScalarXMLValue(params.rule, params.xmlValue)
  if (ambiguousScalar !== undefined) {
    collection.collector.setXmlText(`${collection.logicalAddress}.${params.propertyKey}`, ambiguousScalar)
  }
}

export function collectConfigurationIndexImportedValue(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  importedValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || !isRecord(params.importedValue)) return

  const xmlPrefix = params.importedValue.xmlPrefix
  const address = params.logicalAddress ?? `${collection.logicalAddress}.${params.propertyKey}`
  if (typeof xmlPrefix === "string") {
    collection.collector.setXmlPrefix(address, xmlPrefix)
  }
}

function isNameReconstructible(logicalAddress: string, xmlName: string, reconstructibleXmlName?: string): boolean {
  const lastSegment = logicalAddress.slice(logicalAddress.lastIndexOf(".") + 1)
  return (reconstructibleXmlName ?? lastSegment) === xmlName
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function hasXsiNil(value: unknown): boolean {
  if (!isRecord(value)) return false
  return value["_xsi:nil"] === true || value["_xsi:nil"] === "true"
}

function getUnrepresentedXsiType(value: unknown): string | undefined {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "_xsi:type")) return undefined
  const xsiType = value["_xsi:type"]
  return typeof xsiType === "string" ? xsiType : undefined
}

function ruleRepresentsXsiNil(rule: PropertyRule): boolean {
  if ("exportNilValue" in rule && rule.exportNilValue === true) return true
  return hasXsiNil(rule.defaultValueXMLRaw)
}

function ambiguousImplicitScalarXMLValue(rule: PropertyRule, xmlValue: unknown): string | undefined {
  if (
    !Object.prototype.hasOwnProperty.call(rule, "defaultValueXML") ||
    !Object.prototype.hasOwnProperty.call(rule, "implicitValueYAML") ||
    typeof rule.defaultValueXML === "function" ||
    typeof rule.implicitValueYAML === "function" ||
    String(rule.defaultValueXML) === String(rule.implicitValueYAML)
  ) {
    return undefined
  }
  const scalar =
    xmlValue !== null && typeof xmlValue === "object" && !Array.isArray(xmlValue) && "#text" in xmlValue
      ? xmlValue["#text"]
      : xmlValue
  if (
    (typeof scalar !== "string" && typeof scalar !== "number" && typeof scalar !== "boolean") ||
    String(scalar) !== String(rule.implicitValueYAML)
  ) {
    return undefined
  }
  return String(scalar)
}
