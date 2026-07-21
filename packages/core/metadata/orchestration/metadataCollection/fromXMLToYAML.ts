import type { ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromXMLToYAML } from "../metadataItem/fromXMLToYAML"
import { configurationIndexItemContext } from "./fromXML"
import type { DirectImportTraversal } from "../property/importYamlTypes"
import type { PropertyRuleType } from "../property/registry"
import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "../property/types"
import { enterNestedYamlRule } from "../property/yamlRuleCursor"

export function importMetadataItemCollectionFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  itemRule: MetadataItemRule
  xmlElement: string
  keyField?: string
  yamlAsArray?: true
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  recordYamlKeyFromYAML?: (params: { yaml: Record<string, unknown>; name: string }) => string
  traversal: DirectImportTraversal
}): Record<string, unknown> | Array<Record<string, unknown>> | undefined {
  const items = normalizeCollectionItems(params.xml, params.xmlElement)
  if (items.length === 0) return undefined

  const yamlItems = items.flatMap((itemXml, index) => {
    const itemName = itemNameFromXML(itemXml, params.itemRule, params.keyField)
    const itemContext = configurationIndexItemContext({
      context: params.context,
      item: itemXml,
      itemRule: params.itemRule,
      index,
      options: {
        propertyType: params.propertyType,
        configurationIndexUidSegment: params.configurationIndexUidSegment,
        configurationIndexAddressing: params.configurationIndexAddressing,
        ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
      },
    })
    const yamlPath =
      params.yamlAsArray === true
        ? [...params.traversal.yamlPath, index]
        : [...params.traversal.yamlPath, itemName ?? String(index)]
    const itemYaml = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: params.itemRule,
      xml: itemXml,
      name: itemName,
      traversal: enterNestedYamlRule(
        {
          yamlPath,
          rulePath: params.traversal.rulePath,
          collector: params.traversal.collector,
        },
        params.itemRule.itemType
      ),
    })
    if (itemYaml === undefined) return []
    return [{ yaml: itemYaml, name: itemName ?? String(index) }]
  })
  if (yamlItems.length === 0) return undefined

  if (params.yamlAsArray === true) return yamlItems.map(({ yaml }) => yaml)

  const keyField = params.keyField
  if (keyField === undefined) return undefined
  const keyRule = params.itemRule.properties[keyField]
  const keyYaml = keyRule?.yaml ?? keyField
  return Object.fromEntries(
    yamlItems.map(({ yaml, name }) => {
      const yamlKey = params.recordYamlKeyFromYAML?.({ yaml, name }) ?? String(yaml[keyYaml])
      delete yaml[keyYaml]
      return [yamlKey, yaml]
    })
  )
}

function normalizeCollectionItems(xml: unknown, xmlElement: string): Record<string, unknown>[] {
  if (Array.isArray(xml)) {
    const isWrapped = xml.every((entry) => asRecord(entry)?.[xmlElement] !== undefined)
    const items = isWrapped ? xml.flatMap((entry) => toArray(asRecord(entry)?.[xmlElement])) : xml
    return items.flatMap((item) => {
      const record = asRecord(item)
      return record === undefined ? [] : [record]
    })
  }

  const record = asRecord(xml)
  if (record === undefined) return []
  const nested = record[xmlElement]
  return nested === undefined ? [record] : toArray(nested).flatMap((item) => {
    const itemRecord = asRecord(item)
    return itemRecord === undefined ? [] : [itemRecord]
  })
}

function itemNameFromXML(xml: Record<string, unknown>, rule: MetadataItemRule, keyField?: string): string | undefined {
  if (typeof xml._name === "string" && xml._name.length > 0) return xml._name

  const nameRule = rule.properties[keyField ?? "name"]
  if (nameRule === undefined) return undefined
  let source: Record<string, unknown> | undefined = xml
  for (const parent of nameRule.xmlParents ?? []) source = asRecord(source?.[parent])
  const value = source?.[nameRule.xml ?? "Name"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
