import { capitalize, yamlScalarTagAt } from "@nkdk/runtime"
import { childSegmentUid } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemYamlToXmlAugmenter } from "../../ruleRuntime/property/yamlToXmlAugmenter"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { getCompiledXMLPropertyOrder } from "../../ruleRuntime/property/xmlPropertyOrder"
import { EXTENDED_SNAPSHOT_SEGMENTS } from "./propertyStates"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../../ruleRuntime/definition"
import { exportMultiStateType, isMultiStateTypeYAML } from "./multiState"
import { readPropertyStateSections } from "./sections"
import { decodeExplicitXMLPropertyState } from "./explicitXMLState"

const EXTENDED_CONFIGURATION_OBJECT_YAML = "ОбъектРасширяемойКонфигурации"

export const configurationExtensionYamlToXmlAugmenter: MetadataItemYamlToXmlAugmenter = {
  augment({ context, rule, yaml, outputs, logicalAddress }) {
    copyExtendedSnapshotState(context, rule, logicalAddress)
    const adoptedUuid = context.exportToXML.adoptedUuids?.[logicalAddress]
    if (rule.itemType === "MetadataConfigurationExtension") {
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      if (adoptedUuid !== undefined) {
        writeServiceProperty(outputs, rule, "extendedConfigurationObject", "ExtendedConfigurationObject", adoptedUuid)
        context.exportToXML.configurationIndex?.collector.setXmlFlag(logicalAddress, "extended")
      }
    } else if (adoptedUuid !== undefined && supportsAdoptionServiceProperties(rule)) {
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      writeServiceProperty(outputs, rule, "extendedConfigurationObject", "ExtendedConfigurationObject", adoptedUuid)
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
    restoreIndexedInternalInfo(context, outputs, rule, logicalAddress)
    reorderServiceProperties(outputs, rule)
    reorderMetadataRoot(outputs, rule)
  },
}

function copyExtendedSnapshotState(
  context: ConfigurationContextWithExportToXML,
  rule: MetadataItemRule,
  logicalAddress: string
): void {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return
  for (const segment of new Set(Object.values(EXTENDED_SNAPSHOT_SEGMENTS[rule.itemType] ?? {}))) {
    const address = childSegmentUid(logicalAddress, segment)
    if (runtime.xml(address)?.extended === true) {
      runtime.collector.setXmlFlag(address, "extended")
    }
  }
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

function restoreIndexedInternalInfo(
  context: ConfigurationContextWithExportToXML,
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule,
  logicalAddress: string
): void {
  const xmlRoot = rule.properties.xmlRoot
  if (xmlRoot?.type === "XMLRoot" && xmlRoot.isFileRoot === true) return
  if (
    context.exportToXML.configurationIndex?.xml(childSegmentUid(logicalAddress, "InternalInfo"))?.present !== true
  ) {
    return
  }
  const propertiesParents = rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
  const output = findMetadataOutput(outputs, propertiesParents)
  if (output === undefined) return
  const ownerParents = rule.itemType === "ClientApplicationForm" ? ["Form"] : []
  const owner = recordAt(output, ownerParents)
  if (!Object.prototype.hasOwnProperty.call(owner, "InternalInfo")) owner.InternalInfo = {}
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
  const states: Record<string, string>[] = []
  const itemCapability = propertyStateRegistry()?.item(params.rule.itemType)
  const sectionStates = itemCapability === undefined
    ? new Map<string, "notify" | "extend">()
    : readPropertyStateSections(params.yaml, itemCapability)
  if (yamlScalarTagAt(params.yaml, EXTENDED_CONFIGURATION_OBJECT_YAML) === "проверять") {
    states.push(propertyState("ExtendedConfigurationObject", "Notify"))
  }

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    const yamlName = propertyRule.yaml
    const xmlName = propertyRule.xml ?? capitalize(propertyKey)
    const yamlValue = typeof yamlName === "string" ? params.yaml[yamlName] : undefined
    const capability = propertyStateRegistry()?.resolve({
      itemType: params.rule.itemType,
      propertyKey,
    })
    const sectionMode = sectionStates.get(propertyKey)
    if (
      typeof yamlName === "string" && yamlScalarTagAt(params.yaml, yamlName) === "xml" &&
      typeof yamlValue === "string"
    ) {
      const explicit = decodeExplicitXMLPropertyState(yamlValue, {
        itemType: params.rule.itemType,
        propertyKey,
      })
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, explicit.propertyXML)
      states.push({ ...explicit.propertyStateXML })
      continue
    }
    if (sectionMode !== undefined) {
      states.push(propertyState(xmlName, sectionMode === "notify" ? "Notify" : "Extended"))
      continue
    }
    if (
      typeof yamlName === "string" &&
      propertyRule.type === "TypeDescription" &&
      isMultiStateTypeYAML(yamlValue)
    ) {
      const multiState = exportMultiStateType(params.context, propertyRule, yamlValue)
      writePropertyValue(params.outputs, propertyRule.xmlParents ?? [], xmlName, multiState.value)
      states.push(propertyState(xmlName, multiState.state))
      continue
    }
    if (
      typeof yamlName === "string" &&
      yamlName !== EXTENDED_CONFIGURATION_OBJECT_YAML &&
      yamlScalarTagAt(params.yaml, yamlName) === "проверять"
    ) {
      states.push(propertyState(xmlName, "Notify"))
      continue
    }
    if (typeof yamlName === "string" && yamlScalarTagAt(params.yaml, yamlName) === "изменять") {
      states.push(propertyState(xmlName, "Extended"))
      continue
    }
    if (
      typeof yamlName === "string" &&
      Object.prototype.hasOwnProperty.call(params.yaml, yamlName) &&
      capability?.modes.length === 1 && capability.modes[0] === "extend" &&
      capability.representation !== "section"
    ) {
      states.push(propertyState(xmlName, "Extended"))
      continue
    }
    const segment = EXTENDED_SNAPSHOT_SEGMENTS[params.rule.itemType]?.[xmlName]
    if (
      segment !== undefined &&
      params.context.exportToXML.configurationIndex?.xml(childSegmentUid(params.logicalAddress, segment))?.extended ===
        true
    ) {
      states.push(propertyState(xmlName, "Extended"))
    }
  }

  const declaredXmlNames = new Set(
    Object.entries(params.rule.properties).map(
      ([propertyKey, propertyRule]) => propertyRule.xml ?? capitalize(propertyKey)
    )
  )
  for (const [xmlName, segment] of Object.entries(EXTENDED_SNAPSHOT_SEGMENTS[params.rule.itemType] ?? {})) {
    if (declaredXmlNames.has(xmlName)) continue
    if (
      params.context.exportToXML.configurationIndex?.xml(childSegmentUid(params.logicalAddress, segment))?.extended ===
      true
    ) {
      states.push(propertyState(xmlName, "Extended"))
    }
  }
  return states
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
