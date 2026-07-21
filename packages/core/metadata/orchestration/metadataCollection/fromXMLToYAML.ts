import type { ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromXMLToYAML } from "../metadataItem/fromXMLToYAML"
import { configurationIndexItemContext } from "./fromXML"
import type { DirectImportTraversal, LocalIndexesCollector, LocalYamlFact } from "../property/importYamlTypes"
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
  const keyField = params.keyField
  const keyYaml = keyField === undefined ? undefined : params.itemRule.properties[keyField]?.yaml ?? keyField

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
    const bufferedCollector =
      params.yamlAsArray === true || keyYaml === undefined || params.recordYamlKeyFromYAML === undefined
        ? undefined
        : createBufferedItemCollector(params.traversal.collector, yamlPath)
    const itemYaml = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: params.itemRule,
      xml: itemXml,
      name: itemName,
      traversal: enterNestedYamlRule(
        {
          yamlPath,
          rulePath: params.traversal.rulePath,
          collector: bufferedCollector?.collector ?? params.traversal.collector,
        },
        params.itemRule.itemType
      ),
    })
    if (itemYaml === undefined) return []
    const name = itemName ?? String(index)
    const yamlKey =
      keyYaml === undefined
        ? undefined
        : params.recordYamlKeyFromYAML?.({ yaml: itemYaml, name }) ??
          (itemYaml[keyYaml] === undefined ? name : String(itemYaml[keyYaml]))
    if (yamlKey !== undefined) bufferedCollector?.flush([...params.traversal.yamlPath, yamlKey])
    return [{ yaml: itemYaml, name, yamlKey }]
  })
  if (yamlItems.length === 0) return undefined

  if (params.yamlAsArray === true) return yamlItems.map(({ yaml }) => yaml)

  if (keyYaml === undefined) return undefined
  return Object.fromEntries(
    yamlItems.map(({ yaml, yamlKey }) => {
      delete yaml[keyYaml]
      return [yamlKey!, yaml]
    })
  )
}

function createBufferedItemCollector(parent: LocalIndexesCollector, sourceYamlPath: readonly (string | number)[]) {
  const facts: Array<{ kind: "property" | "complete"; fact: LocalYamlFact }> = []
  const collector: LocalIndexesCollector = {
    acceptProperty: (fact) => facts.push({ kind: "property", fact }),
    completeValue: (fact) => facts.push({ kind: "complete", fact }),
    finish: () => parent.finish(),
  }

  return {
    collector,
    flush(yamlPath: readonly (string | number)[]) {
      for (const { kind, fact } of facts) {
        const nextFact = {
          ...fact,
          yamlPath: [...yamlPath, ...fact.yamlPath.slice(sourceYamlPath.length)],
        }
        if (kind === "property") parent.acceptProperty(nextFact)
        else parent.completeValue(nextFact)
      }
    },
  }
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
