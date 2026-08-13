import { capitalize, markYAMLScalarTag } from "@nkdk/runtime"
import type { MetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { exportPropertyValueToYAML, getImplicitValueYAML, importPropertyFromXML } from "@nkdk/runtime/rule-kit"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../../ruleRuntime/definition"
import { importMultiStateType } from "./multiState"
import { writePropertyStateSection } from "../../ruleRuntime/property/propertyStateSections"
import { encodeExplicitXMLPropertyState } from "./explicitXMLState"

const NOTIFY_ALIASES: Readonly<Record<string, string>> = {
  ExtendedConfigurationObject: "ОбъектРасширяемойКонфигурации",
}

export const configurationExtensionPropertyStatesAugmenter: MetadataItemXmlImportAugmenter = {
  augment({ context, rule, source, yaml }): void {
    const compatibilityMode = context.fromXML.propertyStateCompatibilityMode
    for (const propertyState of propertyStates(source)) {
      const property = propertyState["xr:Property"]
      const state = propertyState["xr:State"]
      if (typeof property !== "string" || typeof state !== "string") continue
      if (state === "MultiState") {
        const propertyEntry = propertyEntryByXmlName(rule, property)
        const propertyRule = propertyEntry?.[1]
        if (propertyEntry !== undefined && typeof propertyRule?.yaml === "string") {
          const xmlValue = valueAtXmlPath(source, [...(propertyRule.xmlParents ?? []), property])
          yaml[propertyRule.yaml] = importMultiStateType(context, propertyRule, xmlValue)
        }
        continue
      }
      if (state === "Notify") {
        const section = sectionProperty(rule, property, compatibilityMode)
        if (section !== undefined) {
          writePropertyStateSection(yaml, section.item, section.property.externalName!, "notify")
          continue
        }
        const yamlName = propertyYamlName(rule, property)
        if (yamlName !== undefined) {
          ensurePropertyYamlValue({ context, rule, source, yaml, xmlProperty: property, yamlName })
          markPropertyState(yaml, yamlName, "проверять")
        }
        continue
      }
      if (state !== "Extended") {
        if (state !== "NotSet" && state !== "Checked") {
          throw new Error(
            `Неизвестное значение PropertyState ${state} для ${rule.itemType}.${property}`,
          )
        }
        continue
      }
      const section = sectionProperty(rule, property, compatibilityMode)
      if (section !== undefined) {
        writePropertyStateSection(yaml, section.item, section.property.externalName!, "extend")
        continue
      }
      const propertyEntry = propertyEntryByXmlName(rule, property)
      const propertyKey = propertyEntry?.[0]
      const yamlName = propertyYamlName(rule, property)
      if (yamlName !== undefined) {
        ensurePropertyYamlValue({ context, rule, source, yaml, xmlProperty: property, yamlName })
      }
      if (yamlName !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlName)) {
        const registry = propertyStateRegistry()
        const capability = propertyKey === undefined ? undefined : registry?.resolve({
          itemType: rule.itemType,
          propertyKey,
          compatibilityMode,
        })
        const itemCapability = registry?.item(rule.itemType)
        if (
          propertyKey !== undefined &&
          itemCapability !== undefined &&
          (capability === undefined || !capability.modes.includes("extend"))
        ) {
          const propertyRule = rule.properties[propertyKey]!
          yaml[yamlName] = encodeExplicitXMLPropertyState({
            itemType: rule.itemType,
            propertyKey,
            propertyXML: valueAtXmlPath(source, [...(propertyRule.xmlParents ?? []), property]),
            propertyStateXML: {
              "xr:Property": property,
              "xr:State": state,
            },
          })
          markYAMLScalarTag(yaml, yamlName, "xml")
          continue
        }
        if (capability?.modes.length !== 1 || capability.modes[0] !== "extend") {
          markYAMLScalarTag(yaml, yamlName, "изменять")
        }
        continue
      }
    }
    importPresentPlainProperties({ context, rule, source, yaml, compatibilityMode })
    const serviceProperties = extensionServiceProperties(source, rule)
    if (
      supportsAdoptionServiceProperties(rule) &&
      serviceProperties?.objectBelonging === "Adopted" &&
      !serviceProperties.hasExtendedConfigurationObject &&
      !Object.prototype.hasOwnProperty.call(yaml, NOTIFY_ALIASES.ExtendedConfigurationObject)
    ) {
      yaml[NOTIFY_ALIASES.ExtendedConfigurationObject] = false
    }
  },
}

function importPresentPlainProperties(params: {
  readonly context: Parameters<typeof importPropertyFromXML>[0]["context"]
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
  readonly compatibilityMode?: string
}): void {
  const item = propertyStateRegistry()?.item(params.rule.itemType, params.compatibilityMode)
  for (const [propertyKey, capability] of Object.entries(item?.properties ?? {})) {
    if (
      capability.availability !== "borrowed" ||
      capability.representation !== "plain" ||
      capability.modes.length !== 1 ||
      capability.modes[0] !== "extend"
    ) continue
    const propertyRule = params.rule.properties[propertyKey]
    if (propertyRule === undefined || typeof propertyRule.yaml !== "string") continue
    const xmlProperty = propertyRule.xml ?? capitalize(propertyKey)
    const owner = asRecord(valueAtXmlPath(params.source, propertyRule.xmlParents ?? []))
    if (owner === undefined || !Object.prototype.hasOwnProperty.call(owner, xmlProperty)) continue
    ensurePropertyYamlValue({
      context: params.context,
      rule: params.rule,
      source: params.source,
      yaml: params.yaml,
      xmlProperty,
      yamlName: propertyRule.yaml,
      emptyValue: emptyPlainYAMLValue(propertyRule.type),
    })
  }
}

function emptyPlainYAMLValue(type: MetadataItemRule["properties"][string]["type"]): unknown {
  if (type === "MetadataObjectRefCollection" || type === "MetadataItemLinks") return []
  if (type === "string" || type === "I8nText" || type === "MetadataItemLink") return ""
  return {}
}

function extensionServiceProperties(
  source: Record<string, unknown>,
  rule: MetadataItemRule,
): { readonly objectBelonging: unknown; readonly hasExtendedConfigurationObject: boolean } | undefined {
  const extendedRule = rule.properties.extendedConfigurationObject
  const objectBelongingRule = rule.properties.objectBelonging
  const parents = extendedRule?.xmlParents ?? objectBelongingRule?.xmlParents ??
    (rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"])
  const properties = asRecord(valueAtXmlPath(source, parents))
  if (properties === undefined) return undefined
  const objectBelongingXML = objectBelongingRule?.xml ?? "ObjectBelonging"
  const extendedConfigurationObjectXML = extendedRule?.xml ?? "ExtendedConfigurationObject"
  return {
    objectBelonging: properties[objectBelongingXML],
    hasExtendedConfigurationObject: Object.prototype.hasOwnProperty.call(
      properties,
      extendedConfigurationObjectXML,
    ),
  }
}

function supportsAdoptionServiceProperties(rule: MetadataItemRule): boolean {
  return rule.itemType === "MetadataConfigurationExtension" ||
    rule.itemType === "ClientApplicationForm" ||
    rule.properties.uuid !== undefined
}

function ensurePropertyYamlValue(params: {
  readonly context: Parameters<typeof importPropertyFromXML>[0]["context"]
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
  readonly xmlProperty: string
  readonly yamlName: string
  readonly emptyValue?: unknown
}): void {
  if (Object.prototype.hasOwnProperty.call(params.yaml, params.yamlName)) return
  const propertyRule = propertyEntryByXmlName(params.rule, params.xmlProperty)?.[1]
  if (propertyRule === undefined) return
  const xmlValue = valueAtXmlPath(params.source, [...(propertyRule.xmlParents ?? []), params.xmlProperty])
  const importedValue = importPropertyFromXML({
    context: params.context,
    rule: propertyRule,
    value: xmlValue,
  })
  const yamlValue = exportPropertyValueToYAML({
    context: params.context,
    rule: propertyRule,
    value: importedValue,
    preserveImplicitValue: true,
  })
  params.yaml[params.yamlName] = yamlValue ?? getImplicitValueYAML(propertyRule) ?? params.emptyValue ?? {}
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

function sectionProperty(rule: MetadataItemRule, xmlProperty: string, compatibilityMode?: string) {
  const propertyKey = propertyKeyByXmlName(rule, xmlProperty)
  const item = propertyStateRegistry()?.item(rule.itemType, compatibilityMode)
  const resolvedPropertyKey = propertyKey ?? Object.keys(item?.properties ?? {}).find(
    (key) => capitalize(key) === xmlProperty,
  )
  const property = resolvedPropertyKey === undefined ? undefined : item?.properties[resolvedPropertyKey]
  return item !== undefined && property?.representation === "section" && property.externalName !== undefined
    ? { item, property }
    : undefined
}

function propertyStates(source: Record<string, unknown>): Record<string, unknown>[] {
  const internalInfo = asRecord(source["InternalInfo"])
  const value = internalInfo?.["xr:PropertyState"]
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.flatMap((entry) => {
    const record = asRecord(entry)
    return record === undefined ? [] : [record]
  })
}

function propertyYamlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  const alias = NOTIFY_ALIASES[xmlProperty]
  if (alias !== undefined) return alias
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

function valueAtXmlPath(source: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = source
  for (const segment of path) current = asRecord(current)?.[segment]
  return current
}
