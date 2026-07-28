import { capitalize } from "../../../helpers/capitalize"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import { getConfigurationIndexPropertyOrder } from "../../configurationIndex/referenceView"
import type { MetadataItemYamlToXmlAugmenter } from "../../orchestration/property/yamlToXmlAugmenter"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  EXTENDED_SNAPSHOT_SEGMENTS,
  EXTENSION_INTERNAL_INFO_SEGMENT,
  EXTENSION_PROPERTY_ORDER_SEGMENT,
} from "./propertyStates"

const EXTENDED_CONFIGURATION_OBJECT_YAML = "ОбъектРасширяемойКонфигурации"

export const configurationExtensionYamlToXmlAugmenter: MetadataItemYamlToXmlAugmenter = {
  augment({ context, rule, yaml, outputs, logicalAddress }) {
    copyExtensionSnapshotState(context, rule, logicalAddress)
    const adoptedUuid = context.exportToXML.adoptedUuids?.[logicalAddress]
    if (rule.itemType === "MetadataConfigurationExtension") {
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      if (adoptedUuid !== undefined) {
        writeServiceProperty(
          outputs,
          rule,
          "extendedConfigurationObject",
          "ExtendedConfigurationObject",
          adoptedUuid
        )
      }
    } else if (
      adoptedUuid !== undefined &&
      hasIndexedServiceProperty(context, rule, "objectBelonging")
    ) {
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      if (hasIndexedServiceProperty(context, rule, "extendedConfigurationObject")) {
        writeServiceProperty(
          outputs,
          rule,
          "extendedConfigurationObject",
          "ExtendedConfigurationObject",
          adoptedUuid
        )
      }
    }
    restoreMissingInternalInfo(context, outputs, rule)
    reorderServiceProperties(context, outputs, rule)
    reorderMetadataRoot(context, outputs, rule)
    const control = readControl(yaml, rule, logicalAddress)
    const states = propertyStates({
      context,
      rule,
      control,
      logicalAddress,
    })
    if (states.length > 0) writePropertyStates(outputs, rule, states)
  },
}

function copyExtensionSnapshotState(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  rule: MetadataItemRule,
  logicalAddress: string
): void {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return

  const serviceAddress = childSegmentUid(
    logicalAddress,
    EXTENSION_PROPERTY_ORDER_SEGMENT
  )
  const orderAddress = childSegmentUid(
    logicalAddress,
    `${EXTENSION_PROPERTY_ORDER_SEGMENT}:${rule.itemType}`
  )
  for (const propertyKey of [
    "objectBelonging",
    "extendedConfigurationObject",
  ]) {
    if (runtime.source.xmlNode(serviceAddress)?.present?.includes(propertyKey)) {
      runtime.collector.setPresent(serviceAddress, propertyKey)
    }
    if (runtime.source.xmlNode(orderAddress)?.present?.includes(propertyKey)) {
      runtime.collector.setPresent(orderAddress, propertyKey)
    }
  }
  const order = runtime.source.xmlNode(orderAddress)?.order
  if (order !== undefined) runtime.collector.setOrder(orderAddress, order)

  const internalInfoAddress = childSegmentUid(
    logicalAddress,
    `${EXTENSION_INTERNAL_INFO_SEGMENT}:${rule.itemType}`
  )
  if (
    runtime.source.xmlNode(internalInfoAddress)?.present?.includes("internalInfo")
  ) {
    runtime.collector.setPresent(internalInfoAddress, "internalInfo")
  }

  for (const segment of Object.values(
    EXTENDED_SNAPSHOT_SEGMENTS[rule.itemType] ?? {}
  )) {
    const address = childSegmentUid(logicalAddress, segment)
    if (runtime.source.xmlValue(address)?.extended === true) {
      runtime.collector.setExtended(address)
    }
  }
}

function restoreMissingInternalInfo(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule
): void {
  if (
    rule.properties.internalInfo !== undefined ||
    !hasIndexedInternalInfo(context, rule)
  ) {
    return
  }
  const propertiesParents =
    rule.itemType === "ClientApplicationForm"
      ? ["Form", "Properties"]
      : ["Properties"]
  const output = findMetadataOutput(outputs, propertiesParents)
  if (output === undefined) return
  const owner =
    rule.itemType === "ClientApplicationForm"
      ? recordAt(output, ["Form"])
      : output
  if (!Object.prototype.hasOwnProperty.call(owner, "InternalInfo")) {
    owner.InternalInfo = {}
  }
}

function hasIndexedInternalInfo(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  rule: MetadataItemRule
): boolean {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return false
  return runtime.source.xmlNode(
    childSegmentUid(
      runtime.logicalAddress,
      `${EXTENSION_INTERNAL_INFO_SEGMENT}:${rule.itemType}`
    )
  )?.present?.includes("internalInfo") === true
}

function reorderMetadataRoot(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule
): void {
  const propertiesParents =
    rule.itemType === "ClientApplicationForm"
      ? ["Form", "Properties"]
      : ["Properties"]
  const output = findMetadataOutput(outputs, propertiesParents)
  if (output === undefined) return
  const owner =
    rule.itemType === "ClientApplicationForm"
      ? recordAtIfPresent(output, ["Form"])
      : output
  if (owner === undefined) return

  const order = extensionPropertyOrder(context, rule)
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
  for (const serviceKey of [
    "objectBelonging",
    "extendedConfigurationObject",
  ]) {
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

function reorderServiceProperties(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule
): void {
  const parents =
    rule.itemType === "ClientApplicationForm"
      ? ["Form", "Properties"]
      : ["Properties"]
  const output = findMetadataOutput(outputs, parents)
  const properties = output === undefined
    ? undefined
    : recordAtIfPresent(output, parents)
  if (properties === undefined) return

  const xmlNameByPropertyKey = new Map<string, string>([
    ["objectBelonging", "ObjectBelonging"],
    ["extendedConfigurationObject", "ExtendedConfigurationObject"],
  ])
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    xmlNameByPropertyKey.set(
      propertyKey,
      propertyRule.xml ?? capitalize(propertyKey)
    )
  }

  const reordered: Record<string, unknown> = {}
  for (const propertyKey of extensionPropertyOrder(context, rule)) {
    const xmlName = xmlNameByPropertyKey.get(propertyKey)
    if (
      xmlName !== undefined &&
      Object.prototype.hasOwnProperty.call(properties, xmlName)
    ) {
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

function extensionPropertyOrder(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  rule: MetadataItemRule
): readonly string[] {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return getConfigurationIndexPropertyOrder(context)
  return runtime.source.xmlNode(
    childSegmentUid(
      runtime.logicalAddress,
      `${EXTENSION_PROPERTY_ORDER_SEGMENT}:${rule.itemType}`
    )
  )?.order ?? getConfigurationIndexPropertyOrder(context)
}

function hasIndexedServiceProperty(
  context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"],
  rule: MetadataItemRule,
  propertyKey: "objectBelonging" | "extendedConfigurationObject"
): boolean {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return false
  return runtime.source.xmlNode(
    childSegmentUid(
      runtime.logicalAddress,
      `${EXTENSION_PROPERTY_ORDER_SEGMENT}:${rule.itemType}`
    )
  )?.present?.includes(propertyKey) === true
}

function propertyStates(params: {
  readonly context: Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0]["context"]
  readonly rule: MetadataItemRule
  readonly control: ReadonlySet<string>
  readonly logicalAddress: string
}): Record<string, string>[] {
  const states: Record<string, string>[] = []
  if (params.control.has(EXTENDED_CONFIGURATION_OBJECT_YAML)) {
    states.push(propertyState("ExtendedConfigurationObject", "Notify"))
  }

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    const yamlName = propertyRule.yaml
    const xmlName = propertyRule.xml ?? capitalize(propertyKey)
    if (
      typeof yamlName === "string" &&
      yamlName !== EXTENDED_CONFIGURATION_OBJECT_YAML &&
      params.control.has(yamlName)
    ) {
      states.push(propertyState(xmlName, "Notify"))
      continue
    }
    const segment = EXTENDED_SNAPSHOT_SEGMENTS[params.rule.itemType]?.[xmlName]
    if (
      segment !== undefined &&
      params.context.exportToXML.configurationIndex?.source
        .xmlValue(childSegmentUid(params.logicalAddress, segment))?.extended === true
    ) {
      states.push(propertyState(xmlName, "Extended"))
    }
  }

  const declaredXmlNames = new Set(
    Object.entries(params.rule.properties).map(
      ([propertyKey, propertyRule]) => propertyRule.xml ?? capitalize(propertyKey)
    )
  )
  for (const [xmlName, segment] of Object.entries(
    EXTENDED_SNAPSHOT_SEGMENTS[params.rule.itemType] ?? {}
  )) {
    if (declaredXmlNames.has(xmlName)) continue
    if (
      params.context.exportToXML.configurationIndex?.source
        .xmlValue(childSegmentUid(params.logicalAddress, segment))?.extended === true
    ) {
      states.push(propertyState(xmlName, "Extended"))
    }
  }
  return states
}

function readControl(
  yaml: Readonly<Record<string, unknown>>,
  rule: MetadataItemRule,
  logicalAddress: string
): ReadonlySet<string> {
  const value = yaml["Контроль"]
  if (value === undefined) return new Set()
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Контроль должен быть массивом строк: ${logicalAddress}`)
  }
  const known = new Set<string>([EXTENDED_CONFIGURATION_OBJECT_YAML])
  for (const propertyRule of Object.values(rule.properties)) {
    if (typeof propertyRule.yaml === "string") known.add(propertyRule.yaml)
  }
  for (const item of value) {
    if (!known.has(item)) {
      throw new Error(`Неизвестное свойство Контроль "${item}": ${logicalAddress}`)
    }
  }
  return new Set(value)
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
    propertyRule?.xmlParents ??
    (rule.itemType === "ClientApplicationForm"
      ? ["Form", "Properties"]
      : ["Properties"])
  const output = findMetadataOutput(outputs, parents)
  if (output === undefined) return
  recordAt(output, parents)[propertyRule?.xml ?? xmlName] = value
}

function writePropertyStates(
  outputs: ReadonlyMap<string, Record<string, unknown>>,
  rule: MetadataItemRule,
  states: readonly Record<string, string>[]
): void {
  const parents =
    rule.itemType === "ClientApplicationForm" ? ["Form", "InternalInfo"] : ["InternalInfo"]
  const serviceParents =
    rule.itemType === "ClientApplicationForm" ? ["Form", "Properties"] : ["Properties"]
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

function recordAt(
  root: Record<string, unknown>,
  parents: readonly string[]
): Record<string, unknown> {
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

function propertyState(property: string, state: "Notify" | "Extended") {
  return { "xr:Property": property, "xr:State": state }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
