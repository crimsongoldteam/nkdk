import { importMetadataItemCollectionFromXMLToYAML } from "../../ruleRuntime/metadataCollection/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import type { StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML, type StandartAttributeName } from "./standartAttributeNames"
import {
  EMPTY_XML_TAG_VALUE,
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
} from "@nkdk/runtime"

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
    recordYamlKeyFromYAML: ({ name }) =>
      names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name,
    traversal: params.traversal,
  })
  collectStandardAttributeOrder(params.context, params.xml)
  if (yaml === undefined || Array.isArray(yaml) || params.context.fromXML.forReference) return yaml

  const canonicalNames = new Set(Object.keys(rule.standartAttributeNames ?? {}))
  if (canonicalNames.size === 0) return yaml
  const preservedEmptyNames = collectPreservedEmptyNames(params.xml)
  for (const name of canonicalNames) {
    if (preservedEmptyNames.has(name)) continue
    const yamlKey = names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name
    if (isEmptyRecord(yaml[yamlKey])) delete yaml[yamlKey]
  }

  return Object.keys(yaml).length === 0 ? EMPTY_XML_TAG_VALUE : yaml
}

function collectStandardAttributeOrder(
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"],
  xml: unknown,
): void {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return
  const source = asRecord(xml)?.["xr:StandardAttribute"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const names: string[] = []
  for (const item of items) {
    const name = asRecord(item)?._name
    if (typeof name === "string" && !names.includes(name)) names.push(name)
  }
  if (names.length === 0) return
  collection.collector.setOmittedChildren(
    getConfigurationIndexCollectionXmlNodeLogicalAddress(collection),
    { kind: "names", names },
  )
}

function collectPreservedEmptyNames(xml: unknown): Set<string> {
  const source = asRecord(xml)?.["xr:StandardAttribute"] ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const names = new Set<string>()
  for (const item of items) {
    const record = asRecord(item)
    if (record === undefined || typeof record._name !== "string") continue
    if (!/^ExtDimension(Type)?\d+$/.test(record._name)) continue
    names.add(record._name)
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
