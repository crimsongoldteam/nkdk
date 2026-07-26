import { capitalize } from "../../../helpers/capitalize"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import type { MetadataItemYamlToXmlAugmenter } from "../../orchestration/property/yamlToXmlAugmenter"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { EXTENDED_SNAPSHOT_SEGMENTS } from "./propertyStates"

const EXTENDED_CONFIGURATION_OBJECT_YAML = "ОбъектРасширяемойКонфигурации"

export const configurationExtensionYamlToXmlAugmenter: MetadataItemYamlToXmlAugmenter = {
  augment({ context, rule, yaml, outputs, logicalAddress }) {
    const adoptedUuid = context.exportToXML.adoptedUuids?.[logicalAddress]
    if (adoptedUuid !== undefined) {
      writeServiceProperty(outputs, rule, "objectBelonging", "ObjectBelonging", "Adopted")
      writeServiceProperty(
        outputs,
        rule,
        "extendedConfigurationObject",
        "ExtendedConfigurationObject",
        adoptedUuid
      )
    }

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
    if (typeof yamlName !== "string" || yamlName === EXTENDED_CONFIGURATION_OBJECT_YAML) {
      continue
    }
    const xmlName = propertyRule.xml ?? capitalize(propertyKey)
    if (params.control.has(yamlName)) {
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
