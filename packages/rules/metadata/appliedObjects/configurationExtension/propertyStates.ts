import { capitalize, isEmptyXmlElement, isXmlElementNode, markYAMLScalarTag, yamlScalarTagAt, type XmlElementNode } from "@nkdk/runtime"
import type { MetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { convertPropertyFromXMLToYAML, getImplicitValueYAML } from "@nkdk/runtime/rule-kit"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry, ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { importMultiStateType } from "./multiState"
import { propertyStateSectionNames, writePropertyStateSection } from "../../ruleRuntime/property/propertyStateSections"
import { getOwnPropertyImplicitValueYAML } from "../../ruleRuntime/property/propertyStateSchema"
import {
  EXTENDED_CONFIGURATION_OBJECT_YAML,
  writeExtendedConfigurationObjectYAML,
} from "./extendedConfigurationObjectYAML"
import { configurationExtensionCollectionYamlDependencies, importConfigurationExtensionCollectionState } from "./collectionStates"
import { ImportSourceReader, importSourceScalar } from "./importSource"

export const configurationExtensionPropertyStatesAugmenter: MetadataItemXmlImportAugmenter = {
  yamlDependencies({ context, rule, source }) {
    const reader = new ImportSourceReader()
    const names = new Set([...propertyStateSectionNames, ...configurationExtensionCollectionYamlDependencies(rule)])
    const item = propertyStateRegistry()?.item(rule.itemType, context.fromXML.propertyStateCompatibilityMode)
    const borrowed = context.fromXML.currentXMLDefaultVariant === "adopted"
    for (const state of propertyStates(reader, source)) {
      if (typeof state.property !== "string") continue
      const key = propertyKeyForState(rule, item, state.property)
      const property = key === undefined ? undefined : rule.properties[key]
      if (typeof property?.yaml === "string" && item?.properties[key!]?.representation !== "section") names.add(property.yaml)
    }
    for (const [key, capability] of Object.entries(item?.properties ?? {})) {
      const property = rule.properties[key]
      if (typeof property?.yaml !== "string" || property.xmlOnly === true) continue
      if (!borrowed && property.metadataTarget !== undefined && Object.hasOwn(property, "implicitValueYAML")) names.add(property.yaml)
      if (capability.availability === "own") {
        if (getOwnPropertyImplicitValueYAML(property) !== undefined) names.add(property.yaml)
        continue
      }
      if (!borrowed) continue
      const owner = valueAtImportXmlPath(reader, source, rule, property.xmlParents ?? [])
      if (reader.hasProperty(owner, property.xml ?? capitalize(key))) names.add(property.yaml)
    }
    return [...names]
  },
  resolveCurrentXMLDefaultVariant({ rule, source }) {
    if (rule.properties.objectBelonging === undefined) return undefined
    return extensionServiceProperties(new ImportSourceReader(), source, rule)?.objectBelonging === "Adopted"
      ? "adopted"
      : "full"
  },
  augment({ context, rule, source, yaml }): void {
    const reader = new ImportSourceReader()
    importConfigurationExtensionCollectionState({ context, rule, source, yaml })
    const serviceProperties = extensionServiceProperties(reader, source, rule)
    const compatibilityMode = context.fromXML.propertyStateCompatibilityMode
    if (context.fromXML.currentXMLDefaultVariant !== "adopted") {
      if (serviceProperties?.hasExtendedConfigurationObject === true) {
        throw new Error(`ExtendedConfigurationObject недопустим для full ${rule.itemType}`)
      }
      const states = propertyStates(reader, source)
      if (states.length > 0) {
        throw new Error(`PropertyState недопустим для full ${rule.itemType}`)
      }
      importPresentProperties({ context, rule, source, yaml, compatibilityMode, reader })
      return
    }
    let extendedConfigurationObjectNotify = false
    for (const propertyState of propertyStates(reader, source)) {
      const property = propertyState.property
      const state = propertyState.state
      if (typeof property !== "string" || typeof state !== "string") continue
      const registry = propertyStateRegistry()
      const item = registry?.item(rule.itemType, compatibilityMode)
      const propertyKey = propertyKeyForState(rule, item, property)
      const mode = propertyStateMode(state)
      const capability = propertyKey === undefined ? undefined : registry?.resolve({
        itemType: rule.itemType,
        propertyKey,
        compatibilityMode,
      })
      if (mode === undefined || capability === undefined || !capability.modes.includes(mode)) {
        throw new Error(`Недопустимый PropertyState ${rule.itemType}.${property}=${state}`)
      }
      if (propertyKey === "extendedConfigurationObject") {
        extendedConfigurationObjectNotify = mode === "notify"
        continue
      }
      if (capability.representation === "semantic") {
        const propertyRule = rule.properties[propertyKey!]
        if (propertyRule === undefined || typeof propertyRule.yaml !== "string") {
          throw new Error(`Не задано YAML-свойство PropertyState ${rule.itemType}.${property}`)
        }
        if (!Object.prototype.hasOwnProperty.call(yaml, propertyRule.yaml)) {
          yaml[propertyRule.yaml] = semanticEmptyValue(propertyRule.type, rule.itemType, property)
        }
        continue
      }
      if (capability.representation === "section") {
        if (capability.externalName === undefined) {
          throw new Error(`Не задано имя раздела PropertyState ${rule.itemType}.${property}`)
        }
        writePropertyStateSection(yaml, item!, capability.externalName, mode === "notify" ? "notify" : "extend")
        continue
      }
      const propertyRule = rule.properties[propertyKey!]
      const yamlName = propertyYamlName(rule, property)
      if (capability.representation === "multi") {
        if (propertyRule === undefined || typeof propertyRule.yaml !== "string") {
          throw new Error(`Не задано YAML-свойство PropertyState ${rule.itemType}.${property}`)
        }
        if (mode === "multi") {
          const xmlValue = valueAtImportXmlPath(reader, source, rule, [...(propertyRule.xmlParents ?? []), property])
          yaml[propertyRule.yaml] = importMultiStateType(context, propertyRule, xmlValue)
          continue
        }
      }
      if (yamlName === undefined) {
        throw new Error(`Не задано YAML-свойство PropertyState ${rule.itemType}.${property}`)
      }
      ensurePropertyYamlValue({ context, rule, source, yaml, xmlProperty: property, yamlName, reader })
      if (capability.representation === "plain") continue
      compactTaggedDefault(yaml, yamlName, propertyRule)
      markPropertyState(yaml, yamlName, mode === "notify" ? "проверять" : "изменять")
    }
    importPresentProperties({ context, rule, source, yaml, compatibilityMode, reader })
    if (supportsAdoptionServiceProperties(rule) && (
      rule.itemType === "MetadataConfigurationExtension" ||
      serviceProperties?.objectBelonging === "Adopted"
    )) {
      writeExtendedConfigurationObjectYAML(yaml, {
        uuidPresent: serviceProperties?.hasExtendedConfigurationObject === true,
        mode: extendedConfigurationObjectNotify ? "notify" : "control",
      })
    }
  },
}

function semanticEmptyValue(type: string, itemType: string, property: string): Record<string, never> | [] {
  if (type === "Predefined") return {}
  if (type === "ExchangePlanContent") return []
  throw new Error(`Неизвестный смысловой PropertyState ${itemType}.${property}`)
}

function compactTaggedDefault(
  yaml: Record<string, unknown>,
  yamlName: string,
  propertyRule: MetadataItemRule["properties"][string] | undefined,
): void {
  if (propertyRule === undefined) return
  const implicit = getImplicitValueYAML(propertyRule)
  if (implicit !== undefined && yaml[yamlName] === implicit) yaml[yamlName] = {}
}

function propertyStateMode(state: string): "notify" | "extend" | "multi" | undefined {
  if (state === "Notify") return "notify"
  if (state === "Extended") return "extend"
  if (state === "MultiState") return "multi"
  return undefined
}

function propertyKeyForState(
  rule: MetadataItemRule,
  item: ResolvedPropertyStateItemCapability | undefined,
  xmlProperty: string,
): string | undefined {
  return propertyKeyByXmlName(rule, xmlProperty) ?? Object.keys(item?.properties ?? {}).find(
    (propertyKey) => capitalize(propertyKey) === xmlProperty,
  )
}

function importPresentProperties(params: {
  readonly reader: ImportSourceReader
  readonly context: Parameters<typeof convertPropertyFromXMLToYAML>[0]["context"]
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown> | XmlElementNode
  readonly yaml: Record<string, unknown>
  readonly compatibilityMode?: string
}): void {
  const borrowed = params.context.fromXML.currentXMLDefaultVariant === "adopted"
  const item = propertyStateRegistry()?.item(params.rule.itemType, params.compatibilityMode)
  for (const [propertyKey, capability] of Object.entries(item?.properties ?? {})) {
    const propertyRule = params.rule.properties[propertyKey]
    if (propertyRule === undefined || typeof propertyRule.yaml !== "string") continue
    if (propertyRule.xmlOnly === true) continue
    if (
      !borrowed &&
      propertyRule.metadataTarget !== undefined &&
      Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueYAML") &&
      params.yaml[propertyRule.yaml] === null
    ) {
      delete params.yaml[propertyRule.yaml]
      continue
    }
    if (capability.availability === "own") {
      const implicit = getOwnPropertyImplicitValueYAML(propertyRule)
      if (
        implicit !== undefined && (
          params.yaml[propertyRule.yaml] === implicit
          || (propertyRule.metadataTarget !== undefined && params.yaml[propertyRule.yaml] === null)
        )
      ) {
        delete params.yaml[propertyRule.yaml]
      }
      continue
    }
    if (!borrowed) continue
    const xmlProperty = propertyRule.xml ?? capitalize(propertyKey)
    const owner = valueAtImportXmlPath(params.reader, params.source, params.rule, propertyRule.xmlParents ?? [])
    if (!params.reader.hasProperty(owner, xmlProperty)) continue
    const xmlValue = params.reader.property(owner, xmlProperty)
    if (
      capability.modes.includes("control") &&
      yamlScalarTagAt(params.yaml, propertyRule.yaml) === undefined &&
      isExplicitXMLDefault(params.context, propertyRule, xmlValue)
    ) {
      params.yaml[propertyRule.yaml] = undefined
      continue
    }
    if (isXmlElementNode(xmlValue) ? !isEmptyXmlElement(xmlValue) : xmlValue !== undefined && xmlValue !== "" && !isEmptyRecord(xmlValue)) continue
    const emptyValue = emptyPlainYAMLValue(propertyRule.type)
    if (emptyValue === undefined) continue
    ensurePropertyYamlValue({
      reader: params.reader,
      context: params.context,
      rule: params.rule,
      source: params.source,
      yaml: params.yaml,
      xmlProperty,
      yamlName: propertyRule.yaml,
      emptyValue,
    })
  }
}

function isExplicitXMLDefault(
  context: Parameters<typeof convertPropertyFromXMLToYAML>[0]["context"],
  rule: MetadataItemRule["properties"][string],
  value: unknown,
): boolean {
  const imported = convertPropertyFromXMLToYAML({ context, rule, value }).metadataValue
  return (
    Object.prototype.hasOwnProperty.call(rule, "defaultValueAdoptedXML") &&
    imported === convertPropertyFromXMLToYAML({
      context,
      rule,
      value: rule.defaultValueAdoptedXML,
    }).metadataValue
  ) || (
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXML") &&
    imported === convertPropertyFromXMLToYAML({
      context,
      rule,
      value: rule.defaultValueXML,
    }).metadataValue
  )
}

function emptyPlainYAMLValue(type: MetadataItemRule["properties"][string]["type"]): unknown | undefined {
  if (
    type === "MetadataObjectRefCollection" ||
    type === "MetadataItemLinks" ||
    type === "CommonAttributeContent" ||
    type === "FieldsList" ||
    type === "XDTOPackages"
  ) return []
  if (type === "TypeDescription") return []
  if (type === "string" || type === "I8nText" || type === "Picture" || type === "MetadataItemLink") return ""
  return undefined
}

function extensionServiceProperties(
  reader: ImportSourceReader,
  source: Record<string, unknown> | XmlElementNode,
  rule: MetadataItemRule,
): { readonly objectBelonging: unknown; readonly hasExtendedConfigurationObject: boolean } | undefined {
  const extendedRule = rule.properties.extendedConfigurationObject
  const objectBelongingRule = rule.properties.objectBelonging
  const parents = extendedRule?.xmlParents ?? objectBelongingRule?.xmlParents ??
    (rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"])
  const properties = valueAtImportXmlPath(reader, source, rule, parents)
  if (properties === undefined) return undefined
  const objectBelongingXML = objectBelongingRule?.xml ?? "ObjectBelonging"
  const extendedConfigurationObjectXML = extendedRule?.xml ?? "ExtendedConfigurationObject"
  return {
    objectBelonging: importSourceScalar(reader.property(properties, objectBelongingXML)),
    hasExtendedConfigurationObject: reader.hasProperty(
      properties,
      extendedConfigurationObjectXML,
    ),
  }
}

function supportsAdoptionServiceProperties(rule: MetadataItemRule): boolean {
  return rule.properties.objectBelonging !== undefined ||
    rule.properties.uuid !== undefined
}

function ensurePropertyYamlValue(params: {
  readonly reader: ImportSourceReader
  readonly context: Parameters<typeof convertPropertyFromXMLToYAML>[0]["context"]
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown> | XmlElementNode
  readonly yaml: Record<string, unknown>
  readonly xmlProperty: string
  readonly yamlName: string
  readonly emptyValue?: unknown
}): void {
  const propertyRule = propertyEntryByXmlName(params.rule, params.xmlProperty)?.[1]
  if (propertyRule === undefined) return
  if (Object.prototype.hasOwnProperty.call(params.yaml, params.yamlName)) {
    if (propertyRule.metadataTarget !== undefined && params.yaml[params.yamlName] === null) {
      if (getImplicitValueYAML(propertyRule) !== undefined) delete params.yaml[params.yamlName]
      params.yaml[params.yamlName] = params.emptyValue ?? {}
    } else if (
      params.emptyValue !== undefined &&
      isEmptyRecord(params.yaml[params.yamlName]) &&
      yamlScalarTagAt(params.yaml, params.yamlName) === undefined
    ) {
      params.yaml[params.yamlName] = params.emptyValue
    }
    return
  }
  const xmlValue = valueAtImportXmlPath(
    params.reader,
    params.source,
    params.rule,
    [...(propertyRule.xmlParents ?? []), params.xmlProperty],
  )
  const converted = convertPropertyFromXMLToYAML({
    context: params.context,
    rule: propertyRule,
    value: xmlValue,
    preserveImplicitValue: true,
  })
  params.yaml[params.yamlName] = converted.representationValue
    ?? getImplicitValueYAML(propertyRule)
    ?? params.emptyValue
    ?? {}
}

function propertyKeyByXmlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  return propertyEntryByXmlName(rule, xmlProperty)?.[0]
}

function propertyEntryByXmlName(
  rule: MetadataItemRule,
  xmlProperty: string,
): [string, MetadataItemRule["properties"][string]] | undefined {
  return Object.entries(rule.properties).find(([propertyKey, propertyRule]) =>
    (propertyRule.xml ?? capitalize(propertyKey)) === xmlProperty)
}

function propertyStateRegistry(): PropertyStateCapabilityRegistry | undefined {
  return currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()?.propertyStates
}

function propertyStates(reader: ImportSourceReader, source: Record<string, unknown> | XmlElementNode): { property: unknown; state: unknown }[] {
  const internalInfo = reader.property(source, "InternalInfo")
  const value = reader.property(internalInfo, "xr:PropertyState")
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.flatMap((entry) => {
    const record = isXmlElementNode(entry)
      ? entry.attributes.length > 0 || entry.content.some(child => child.type !== "text") ? entry : undefined
      : asRecord(entry)
    return record === undefined ? [] : [{
      property: importSourceScalar(reader.property(record, "xr:Property")),
      state: importSourceScalar(reader.property(record, "xr:State")),
    }]
  })
}

function propertyYamlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  if (xmlProperty === "ExtendedConfigurationObject") return EXTENDED_CONFIGURATION_OBJECT_YAML
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    if ((propertyRule.xml ?? capitalize(propertyKey)) === xmlProperty && typeof propertyRule.yaml === "string") {
      return propertyRule.yaml
    }
  }
  return undefined
}

function markPropertyState(
  yaml: Record<string, unknown>,
  propertyName: string,
  tag: "проверять" | "изменять",
): void {
  if (!Object.prototype.hasOwnProperty.call(yaml, propertyName)) yaml[propertyName] = {}
  markYAMLScalarTag(yaml, propertyName, tag)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
  const record = asRecord(value)
  return record !== undefined && Object.keys(record).length === 0
}

function valueAtXmlPath(reader: ImportSourceReader, source: Record<string, unknown> | XmlElementNode, path: readonly string[]): unknown {
  let current: unknown = source
  for (const segment of path) current = reader.property(current, segment)
  return current
}

function valueAtImportXmlPath(
  reader: ImportSourceReader,
  source: Record<string, unknown> | XmlElementNode,
  rule: MetadataItemRule,
  path: readonly string[],
): unknown {
  return valueAtXmlPath(reader, source, rule.itemType === "ClientApplicationForm" && path[0] === "Form" ? path.slice(1) : path)
}
