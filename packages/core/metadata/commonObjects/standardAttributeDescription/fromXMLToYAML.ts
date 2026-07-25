import { importMetadataItemCollectionFromXMLToYAML } from "../../orchestration/metadataCollection/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../orchestration/property/importYamlTypes"
import type { StandardAttributeDescriptionsPropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML, type StandartAttributeName } from "./standartAttributeNames"

export const importStandardAttributeDescriptionsFromXMLToYAML: ImportFromXMLToYAMLFunction = (params) => {
  const rule = params.rule as StandardAttributeDescriptionsPropertyRule
  const names = rule.standartAttributeNames ?? StandartAttributeNameToYAML
  const yaml = importMetadataItemCollectionFromXMLToYAML({
    context: params.context,
    rule: params.rule,
    xml: params.xml,
    itemRule: StandardAttributeDescriptionRules,
    xmlElement: "xr:StandardAttribute",
    keyField: "name",
    configurationIndexUidSegment: rule.configurationIndexUidSegment,
    preserveItemPropertyPresence: true,
    recordYamlKeyFromYAML: ({ name }) => names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name,
    traversal: params.traversal,
  })
  if (yaml === undefined || Array.isArray(yaml) || params.context.fromXML.forReference) return yaml

  const canonicalNames = new Set(Object.keys(rule.standartAttributeNames ?? {}))
  if (canonicalNames.size === 0) return yaml
  const preservedEmptyNames = collectPreservedEmptyNames(params.xml)
  for (const name of canonicalNames) {
    if (preservedEmptyNames.has(name)) continue
    const yamlKey = names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name
    const value = yaml[yamlKey]
    if (isEmptyRecord(value)) delete yaml[yamlKey]
  }

  return Object.keys(yaml).length === 0 ? undefined : yaml
}

function collectPreservedEmptyNames(xml: unknown): Set<string> {
  const source = asRecord(xml)?.["xr:StandardAttribute"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const names = new Set<string>()
  for (const item of items) {
    const record = asRecord(item)
    if (record === undefined || typeof record._name !== "string") continue
    if (!/^ExtDimension(Type)?\d+$/.test(record._name)) continue
    if (Object.keys(record).every((key) => key.startsWith("_"))) names.add(record._name)
  }
  return names
}

function isEmptyRecord(value: unknown): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
