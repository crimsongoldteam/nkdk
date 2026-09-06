import { importMetadataItemCollectionFromXMLToYAML } from "../../ruleRuntime/metadataCollection/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import type { StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML, type StandartAttributeName } from "./standartAttributeNames"
import { isXmlElementNode, taggedYAMLScalar, xmlAttributeValue, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"

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
    recordYamlKeyFromYAML: ({ name }) =>
      names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name,
    traversal: params.traversal,
  })
  const canonicalNames = new Set(Object.keys(rule.standartAttributeNames ?? {}))
  if (params.context.fromXML.forReference || Array.isArray(yaml)) return yaml
  if (yaml === undefined) {
    return canonicalNames.size > 0
      ? taggedYAMLScalar("xml/standard-attributes", undefined)
      : undefined
  }
  if (canonicalNames.size === 0) return yaml
  const preservedEmptyNames = collectPreservedEmptyNames(params.xml, params.traversal.xmlNodes)
  for (const name of canonicalNames) {
    if (preservedEmptyNames.has(name)) continue
    const yamlKey = names[name] ?? StandartAttributeNameToYAML[name as StandartAttributeName] ?? name
    if (isEmptyRecord(yaml[yamlKey])) delete yaml[yamlKey]
  }

  return Object.keys(yaml).length === 0 && canonicalNames.size > 0
    ? taggedYAMLScalar("xml/standard-attributes", undefined)
    : yaml
}

function collectPreservedEmptyNames(xml: unknown, nodes?: readonly XmlElementNode[]): Set<string> {
  const source = nodes === undefined ? asRecord(xml)?.["xr:StandardAttribute"] ?? xml : undefined
  const items = nodes?.flatMap(node => node.name === "xr:StandardAttribute" ? [node] : xmlElementChildren(node, "xr:StandardAttribute"))
    ?? (Array.isArray(source) ? source : source === undefined ? [] : [source])
  const names = new Set<string>()
  for (const item of items) {
    const name = isXmlElementNode(item) ? xmlAttributeValue(item, "name") : asRecord(item)?._name
    if (typeof name !== "string") continue
    if (name !== "RecordType" && !/^ExtDimension(Type)?\d+$/.test(name)) continue
    names.add(name)
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
