import { capitalize, yamlScalarTagAt } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemYamlToXmlAugmenter } from "../../ruleRuntime/property/yamlToXmlAugmenter"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { getCompiledXMLPropertyOrder } from "../../ruleRuntime/property/xmlPropertyOrder"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../../ruleRuntime/definition"
import { exportMultiStateType, isMultiStateTypeYAML } from "./multiState"
import { readPropertyStateSections } from "../../ruleRuntime/property/propertyStateSections"
import {
  EXTENDED_CONFIGURATION_OBJECT_YAML,
  readExtendedConfigurationObjectYAML,
} from "./extendedConfigurationObjectYAML"

export const configurationExtensionYamlToXmlAugmenter: MetadataItemYamlToXmlAugmenter = {
  augment({ context, rule, yaml, outputs, logicalAddress }) {
    const adoptedUuid = context.exportToXML.adoptedUuids?.[logicalAddress]
    const adopted = rule.itemType === "MetadataConfigurationExtension" ||
      adoptedUuid !== undefined ||
      context.exportToXML.xmlDefaultVariantByLogicalAddress?.[logicalAddress] === "adopted"
    if (adopted && supportsAdoptionServiceProperties(rule)) {
      const extensionObject = readExtendedConfigurationObjectYAML(yaml)
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      if (extensionObject.uuidPresent) {
        if (adoptedUuid === undefined) {
          throw new Error(`Не найден UUID основной конфигурации: ${logicalAddress}`)
        }
        writeServiceProperty(
          outputs,
          rule,
          "extendedConfigurationObject",
          "ExtendedConfigurationObject",
          adoptedUuid,
        )
      }
    }

    if (Object.prototype.hasOwnProperty.call(yaml, "Контроль")) {
      throw new Error(`YAML-поле Контроль больше не поддерживается: ${logicalAddress}`)
    }
    const states = propertyStates({
      context,
      rule,
      yaml,
      outputs,
      logicalAddress,
    })
    if (states.length > 0) writePropertyStates(outputs, rule, states)
    else if (adopted && propertyStateRegistry()?.item(rule.itemType) !== undefined) {
      ensureInternalInfo(outputs, rule)
    }
    reorderServiceProperties(outputs, rule)
    reorderMetadataRoot(outputs, rule)
  },
}

function reorderMetadataRoot(outputs: ReadonlyMap<string, Record<string, unknown>>, rule: MetadataItemRule): void {
  const propertiesParents = rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
  const output = findMetadataOutput(outputs, propertiesParents)
  if (output === undefined) return
  const owner = rule.itemType === "ClientApplicationForm" ? recordAtIfPresent(output, ["Form"]) : output
  if (owner === undefined) return

  const order = currentPropertyOrder(rule)
  const rankByXmlName = new Map<string, number>()
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    const rank = order.indexOf(propertyKey)
    if (rank < 0) continue
    const parents = propertyRule.xmlParents ?? []
    if (parents.length === 0) {
      rankByXmlName.set(propertyRule.xml ?? capitalize(propertyKey), rank)
    } else if (parents.at(-1) === "Properties") {
      const previous = rankByXmlName.get("Properties")
      if (previous === undefined || rank < previous) {
        rankByXmlName.set("Properties", rank)
      }
    }
  }
  const internalInfoRank = order.indexOf("internalInfo")
  if (internalInfoRank >= 0) rankByXmlName.set("InternalInfo", internalInfoRank)
  for (const serviceKey of ["objectBelonging", "extendedConfigurationObject"]) {
    const rank = order.indexOf(serviceKey)
    const previous = rankByXmlName.get("Properties")
    if (rank >= 0 && (previous === undefined || rank < previous)) {
      rankByXmlName.set("Properties", rank)
    }
  }

  const entries = Object.entries(owner)
    .map(([xmlName, value], index) => ({
      xmlName,
      value,
      index,
      rank: rankByXmlName.get(xmlName) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
  for (const xmlName of Object.keys(owner)) delete owner[xmlName]
  for (const { xmlName, value } of entries) owner[xmlName] = value
}

function reorderServiceProperties(outputs: ReadonlyMap<string, Record<string, unknown>>, rule: MetadataItemRule): void {
  const parents = rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
  const output = findMetadataOutput(outputs, parents)
  const properties = output === undefined ? undefined : recordAtIfPresent(output, parents)
  if (properties === undefined) return

  const xmlNameByPropertyKey = new Map<string, string>([
    ["objectBelonging", "ObjectBelonging"],
    ["extendedConfigurationObject", "ExtendedConfigurationObject"],
  ])
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    xmlNameByPropertyKey.set(propertyKey, propertyRule.xml ?? capitalize(propertyKey))
  }

  const reordered: Record<string, unknown> = {}
  for (const propertyKey of currentPropertyOrder(rule)) {
    const xmlName = xmlNameByPropertyKey.get(propertyKey)
    if (xmlName !== undefined && Object.prototype.hasOwnProperty.call(properties, xmlName)) {
      reordered[xmlName] = properties[xmlName]
    }
  }
  for (const [xmlName, value] of Object.entries(properties)) {
    if (!Object.prototype.hasOwnProperty.call(reordered, xmlName)) {
      reordered[xmlName] = value
    }
  }
  for (const xmlName of Object.keys(properties)) delete properties[xmlName]
  Object.assign(properties, reordered)
}

function currentPropertyOrder(rule: MetadataItemRule): readonly string[] {
  const compiled = getCompiledXMLPropertyOrder(rule)
  const order = compiled.filter(
    (propertyKey) => propertyKey !== "objectBelonging" && propertyKey !== "extendedConfigurationObject"
  )
  if (!order.includes("internalInfo")) {
    order.unshift("internalInfo")
  }

  insertAfter(order, "objectBelonging", "internalInfo", "start")
  insertAfter(
    order,
    "extendedConfigurationObject",
    rule.itemType === "MetadataConfigurationExtension" ? "configurationExtensionPurpose" : "comment",
    "end"
  )
  return order
}

function insertAfter(
  order: string[],
  propertyKey: string,
  anchor: string,
  fallback: "start" | "end"
): void {
  const anchorIndex = order.indexOf(anchor)
  order.splice(anchorIndex < 0 ? (fallback === "start" ? 0 : order.length) : anchorIndex + 1, 0, propertyKey)
}

function supportsAdoptionServiceProperties(rule: MetadataItemRule): boolean {
  return rule.itemType === "ClientApplicationForm" || rule.properties.uuid !== undefined
}

function propertyStates(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly rule: MetadataItemRule
  readonly yaml: Readonly<Record<string, unknown>>
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly logicalAddress: string
}): Record<string, string>[] {
  const registry = propertyStateRegistry()
  const itemCapability = registry?.item(params.rule.itemType)
  const sectionStates = itemCapability === undefined
    ? new Map<string, "notify" | "extend">()
    : readPropertyStateSections(params.yaml, itemCapability)
  const statesByPropertyKey = new Map<string, Record<string, string>>()
  const addState = (
    propertyKey: string,
    state: "Notify" | "Extended" | "MultiState",
  ): void => {
    const mode = state === "Notify" ? "notify" : state === "Extended" ? "extend" : "multi"
    const capability = registry?.resolve({ itemType: params.rule.itemType, propertyKey })
    if (capability === undefined || !capability.modes.includes(mode)) {
      throw new Error(`Недопустимый PropertyState ${params.rule.itemType}.${propertyKey}=${state}`)
    }
    const propertyRule = params.rule.properties[propertyKey]
    statesByPropertyKey.set(propertyKey, propertyState(propertyRule?.xml ?? capitalize(propertyKey), state))
  }
  if (readExtendedConfigurationObjectYAML(params.yaml).mode === "notify") {
    addState("extendedConfigurationObject", "Notify")
  }

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    const yamlName = propertyRule.yaml
    const xmlName = propertyRule.xml ?? capitalize(propertyKey)
    const yamlValue = typeof yamlName === "string" ? params.yaml[yamlName] : undefined
    const scalarTag = typeof yamlName === "string" ? yamlScalarTagAt(params.yaml, yamlName) : undefined
    const capability = registry?.resolve({ itemType: params.rule.itemType, propertyKey })
    if (
      capability !== undefined &&
      typeof yamlName === "string" &&
      Object.prototype.hasOwnProperty.call(params.yaml, yamlName) &&
      yamlValue === ""
    ) {
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, "")
    }
    if (
      capability !== undefined &&
      typeof yamlName === "string" &&
      propertyRule.type === "TypeDescription" &&
      Object.prototype.hasOwnProperty.call(params.yaml, yamlName) &&
      Array.isArray(yamlValue) &&
      yamlValue.length === 0
    ) {
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, "")
    }
    if (
      typeof yamlName === "string" &&
      propertyRule.metadataTarget !== undefined &&
      Object.prototype.hasOwnProperty.call(params.yaml, yamlName) &&
      (yamlValue === null || (isEmptyRecord(yamlValue) && scalarTag !== undefined))
    ) {
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, "")
    }
    const sectionMode = sectionStates.get(propertyKey)
    if (sectionMode !== undefined) {
      addState(propertyKey, sectionMode === "notify" ? "Notify" : "Extended")
      continue
    }
    if (
      typeof yamlName === "string" &&
      propertyRule.type === "TypeDescription" &&
      isMultiStateTypeYAML(yamlValue)
    ) {
      const multiState = exportMultiStateType(params.context, propertyRule, yamlValue)
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, multiState.value)
      addState(propertyKey, multiState.state)
      continue
    }
    if (
      typeof yamlName === "string" &&
      yamlName !== EXTENDED_CONFIGURATION_OBJECT_YAML &&
      scalarTag === "проверять"
    ) {
      addState(propertyKey, "Notify")
      continue
    }
    if (typeof yamlName === "string" && scalarTag === "изменять") {
      addState(propertyKey, "Extended")
      continue
    }
  }
  for (const [propertyKey, mode] of sectionStates) {
    if (statesByPropertyKey.has(propertyKey)) continue
    addState(propertyKey, mode === "notify" ? "Notify" : "Extended")
  }
  if (statesByPropertyKey.size === 0) return []
  if (itemCapability === undefined) {
    throw new Error(`Не зарегистрирован порядок PropertyState для ${params.rule.itemType}`)
  }
  const ordered = Object.keys(itemCapability.properties).flatMap((propertyKey) => {
    const state = statesByPropertyKey.get(propertyKey)
    if (state === undefined) return []
    statesByPropertyKey.delete(propertyKey)
    return [state]
  })
  if (statesByPropertyKey.size > 0) {
    throw new Error(`Не зарегистрирован порядок PropertyState для ${params.rule.itemType}.${statesByPropertyKey.keys().next().value}`)
  }
  return ordered
}

function writePropertyValue(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  parents: readonly string[],
  xmlName: string,
  value: unknown,
): void {
  const output = findMetadataOutput(outputs, parents)
  if (output === undefined) return
  recordAt(output, parents)[xmlName] = value
}

function propertyStateRegistry(): PropertyStateCapabilityRegistry | undefined {
  return currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()?.propertyStates
}

function writeServiceProperty(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule,
  propertyKey: string,
  xmlName: string,
  value: unknown
): void {
  const propertyRule = rule.properties[propertyKey]
  const parents =
    propertyRule?.xmlParents ?? (rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"])
  const output = findMetadataOutput(outputs, parents)
  if (output === undefined) return
  recordAt(output, parents)[propertyRule?.xml ?? xmlName] = value
}

function writePropertyStates(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule,
  states: readonly Record<string, string>[]
): void {
  const parents = rule.itemType === "ClientApplicationForm" ? ["Form", "InternalInfo"] : ["InternalInfo"]
  const serviceParents = rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
  const output = findMetadataOutput(outputs, serviceParents) ?? outputs.values().next().value
  if (output === undefined) return
  recordAt(output, parents)["xr:PropertyState"] = [...states]
}

function ensureInternalInfo(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule,
): void {
  const parents = rule.itemType === "ClientApplicationForm" ? ["Form", "InternalInfo"] : ["InternalInfo"]
  const serviceParents = rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
  const output = findMetadataOutput(outputs, serviceParents) ?? outputs.values().next().value
  if (output !== undefined) recordAt(output, parents)
}

function findMetadataOutput(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  parents: readonly string[]
): Record<string, unknown> | undefined {
  for (const output of outputs.values()) {
    if (recordAtIfPresent(output, parents) !== undefined) return output
  }
  return outputs.values().next().value
}

function recordAt(root: Record<string, unknown>, parents: readonly string[]): Record<string, unknown> {
  let current = root
  for (const parent of parents) {
    const existing = asRecord(current[parent])
    if (existing !== undefined) {
      current = existing
      continue
    }
    const created: Record<string, unknown> = {}
    current[parent] = created
    current = created
  }
  return current
}

function recordAtIfPresent(
  root: Record<string, unknown>,
  parents: readonly string[]
): Record<string, unknown> | undefined {
  let current: Record<string, unknown> | undefined = root
  for (const parent of parents) {
    current = current === undefined ? undefined : asRecord(current[parent])
  }
  return current
}

function propertyState(property: string, state: "Notify" | "Extended" | "MultiState") {
  return { "xr:Property": property, "xr:State": state }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function isEmptyRecord(value: unknown): boolean {
  return asRecord(value) !== undefined && Object.keys(value as Record<string, unknown>).length === 0
}
