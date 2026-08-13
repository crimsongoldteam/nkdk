import { capitalize, markYAMLScalarTag } from "@nkdk/runtime"
import { getConfigurationIndexCollectionContext } from "@nkdk/runtime"
import { childSegmentUid } from "@nkdk/runtime"
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
    const collection = getConfigurationIndexCollectionContext(context)
    if (collection !== undefined && Object.prototype.hasOwnProperty.call(source, "InternalInfo")) {
      collection.collector.setXmlFlag(childSegmentUid(collection.logicalAddress, "InternalInfo"), "present")
    }
    const properties = asRecord(source["Properties"])
    if (
      collection !== undefined &&
      properties !== undefined &&
      Object.prototype.hasOwnProperty.call(properties, "ExtendedConfigurationObject")
    ) {
      collection.collector.setXmlFlag(collection.logicalAddress, "extended")
    }
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
  },
}

function ensurePropertyYamlValue(params: {
  readonly context: Parameters<typeof importPropertyFromXML>[0]["context"]
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
  readonly xmlProperty: string
  readonly yamlName: string
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
  params.yaml[params.yamlName] = yamlValue ?? getImplicitValueYAML(propertyRule) ?? {}
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
