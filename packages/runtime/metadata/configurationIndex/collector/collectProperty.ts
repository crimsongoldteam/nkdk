import type { ConfigurationContextFromXML } from "../../context/types"
import { configurationIndexPropertyXmlStateUid } from "../logicalAddress"
import type { ConfigurationIndexValueFromXMLDescriptor } from "../../ruleRuntime/property/fn"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
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
    collection.collector.setIdentity(collection.logicalAddress, "uuid", params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_id") {
    if (params.descriptor?.identityKind === "uuid") {
      collection.collector.setIdentity(collection.logicalAddress, "uuid", params.xmlValue)
    } else {
      collection.collector.setIdentity(collection.logicalAddress, "xmlId", params.xmlValue)
    }
    return
  }
}

export function collectConfigurationIndexPropertyFromXML(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  xmlValue: unknown
  presentInXML: boolean
  rule: PropertyRule
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  if (!collectsConfigurationExtensionState(params.context)) return
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return

  const address =
    params.logicalAddress ??
    configurationIndexPropertyXmlStateUid(collection.logicalAddress, params.propertyKey, undefined, false)
  if (params.presentInXML && propertyPresenceCanBeHiddenInYAML(params.rule)) {
    collection.collector.setXmlFlag(address, "present")
  }
  if (
    params.descriptor?.xsiNilWhenNotRepresentable === true &&
    hasXsiNil(params.xmlValue) &&
    !ruleHasCanonicalXsiNil(params.rule)
  ) {
    collection.collector.setXmlFlag(address, "xsiNil")
  }
  if (params.descriptor?.xsiTypeWhenNotRepresentable === true) {
    const xsiType = getUnrepresentedXsiType(params.xmlValue)
    if (xsiType !== undefined) collection.collector.setXmlValue(address, "xsiType", xsiType)
  }
  if (params.presentInXML && isExplicitEmptyXMLValue(params.xmlValue)) {
    collection.collector.setXmlFlag(address, "explicitEmpty")
  }
  const ambiguousScalar = omittedScalarXMLValue(params.rule, params.xmlValue, params.presentInXML)
  if (ambiguousScalar !== undefined) collection.collector.setXmlValue(address, "xmlText", ambiguousScalar)
}

export function collectConfigurationIndexImportedValue(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  importedValue: unknown
}): void {
  if (!collectsConfigurationExtensionState(params.context)) return
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || !isRecord(params.importedValue)) return
  const xmlPrefix = params.importedValue.xmlPrefix
  const address =
    params.logicalAddress ??
    configurationIndexPropertyXmlStateUid(collection.logicalAddress, params.propertyKey, undefined, false)
  if (typeof xmlPrefix === "string") collection.collector.setXmlValue(address, "xmlPrefix", xmlPrefix)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function collectsConfigurationExtensionState(context: ConfigurationContextFromXML): boolean {
  return "metadataItemAugmenter" in context.fromXML &&
    context.fromXML.metadataItemAugmenter === "configurationExtension"
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

function ruleHasCanonicalXsiNil(rule: PropertyRule): boolean {
  return rule.exportNilValue === true || hasXsiNil(rule.defaultValueXMLRaw)
}

function isExplicitEmptyXMLValue(value: unknown): boolean {
  return value === undefined || value === "" || (isRecord(value) && Object.keys(value).length === 0)
}

function omittedScalarXMLValue(
  rule: PropertyRule,
  xmlValue: unknown,
  presentInXML: boolean
): string | undefined {
  if (!presentInXML) return undefined
  const scalar = isRecord(xmlValue) && "#text" in xmlValue ? xmlValue["#text"] : xmlValue
  if (typeof scalar !== "string" && typeof scalar !== "number" && typeof scalar !== "boolean") return undefined
  const equalsXMLDefault =
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXML") &&
    typeof rule.defaultValueXML !== "function" &&
    String(scalar) === String(rule.defaultValueXML)
  if (equalsXMLDefault) return undefined
  if (!Object.prototype.hasOwnProperty.call(rule, "implicitValueYAML") || typeof rule.implicitValueYAML === "function") {
    return undefined
  }
  return String(scalar)
}

function propertyPresenceCanBeHiddenInYAML(rule: PropertyRule): boolean {
  if (rule.runtimeOnly === true) return false
  if (rule.forReferenceOnly === true && rule.evaluateWhenYAMLMissing === true) return true
  if (rule.yaml === undefined) return false
  if (rule.toYAML === false) {
    return (
      rule.fromXML === false &&
      rule.evaluateWhenYAMLMissing === true &&
      Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")
    )
  }
  if (getTypeRule(rule.type, "yamlToXMLNestedRule")?.kind === "item") return true
  return (
    Object.prototype.hasOwnProperty.call(rule, "implicitValueYAML") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValue") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXML") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty") ||
    rule.excludeIfEqualNameYAML === true
  )
}
