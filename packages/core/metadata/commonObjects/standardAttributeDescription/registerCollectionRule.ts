import { isPair, isScalar, YAMLMap } from "yaml"
import { ConfigurationContext, ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { isEmptyMetadataItem } from "~/metadata/orchestration/formElement/helper"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { defaultGraph } from "~/metadata/relations/graph"
import { StandardAttributeDescriptionRules } from "./rules"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"
import type { StandardAttributeDescription } from "./types"

const EDGE_NAME = "СтандартныйРеквизит"

function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

function findStdAttrsSubmap(currentYamlMap: YAMLMap | undefined, propYaml: string | undefined): YAMLMap | undefined {
  if (!currentYamlMap || !propYaml) return undefined
  const pair = currentYamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === propYaml)
  if (!pair || !isPair(pair)) return undefined
  if (pair.value instanceof YAMLMap) return pair.value as YAMLMap
  return undefined
}

function filterNonEmpty(
  context: ConfigurationContext,
  items: readonly StandardAttributeDescription[] | undefined
): StandardAttributeDescription[] | undefined {
  if (!items) return undefined
  const filtered = items.filter(
    (item) =>
      !isEmptyMetadataItem({
        context,
        rule: StandardAttributeDescriptionRules as any,
        element: item as any,
        ignoreKeys: ["name"],
      })
  )
  return filtered.length > 0 ? filtered : undefined
}

function updateGraph(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  result: readonly StandardAttributeDescription[] | undefined
) {
  const { graphContext } = context
  if (!graphContext?.parentNodeId || rule?.type !== "StandardAttributeDescriptions") return
  const g = context.graph ?? defaultGraph
  const { parentNodeId, filePath, currentYamlMap } = graphContext
  const stdAttrsYamlMap = findStdAttrsSubmap(currentYamlMap, rule.yaml)

  // Build map of explicitly defined items (russianName → item)
  const explicitItems = new Map<string, StandardAttributeDescription>()
  if (result) {
    for (const item of result) {
      const russianName = StandartAttributeNameToYAML[item.name as StandartAttributeName]
      if (russianName) explicitItems.set(russianName, item)
    }
  }

  for (const [internalName, russianName] of Object.entries(rule.standartAttributeNames)) {
    const nodeId = `${parentNodeId}.${russianName}`
    const offset = stdAttrsYamlMap ? findKeyOffset(stdAttrsYamlMap, russianName) : undefined

    g.ensureNode(nodeId, {
      name: russianName,
      positionFrom: offset !== undefined ? { offset } : undefined,
      filePath,
    })

    const edgeKey = `${parentNodeId}:${EDGE_NAME}:${russianName}`
    g.ensureEdge(edgeKey, parentNodeId, nodeId, { yaml: EDGE_NAME, name: EDGE_NAME, kind: "composition" })

    // US 13: standard attributes always have item so they are never treated as stubs
    const item = explicitItems.get(russianName) ?? {
      itemType: "StandardAttributeDescription" as const,
      name: internalName,
    }
    g.setNodeAttribute(nodeId, "item", item)
  }
}

function importStandardAttributeDescriptionsFromYAML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: any
) {
  const result = importMetadataItemCollectionFromYAMLAsRecord({
    context,
    itemRule: StandardAttributeDescriptionRules,
    yaml: value,
    nameFromYAMLKey: StandartAttributeNameFromYAML,
  }) as StandardAttributeDescription[] | undefined

  updateGraph(context, rule, result)
  return result
}

function importStandardAttributeDescriptionsFromXML(
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: any
) {
  const importer = importMetadataItemCollectionFromXML(StandardAttributeDescriptionRules, "xr:StandardAttribute")
  const xmlForImporter =
    xml && typeof xml === "object" && "xr:StandardAttribute" in xml ? xml : { "xr:StandardAttribute": xml }
  const raw = importer(context, rule, xmlForImporter) as StandardAttributeDescription[] | undefined

  const result = filterNonEmpty(context, raw)

  if (result) {
    const canonicalKeys = Object.keys((rule as any).standartAttributeNames ?? {})
    if (canonicalKeys.length > 0) {
      result.sort((a, b) => {
        const idxA = canonicalKeys.indexOf(a.name as string)
        const idxB = canonicalKeys.indexOf(b.name as string)
        return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB)
      })
    }
  }

  updateGraph(context, rule, result)
  return result
}

function exportStandardAttributeDescriptionsToXML(p: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: any
  referenceMetadata?: any
  metadataItem?: any
}) {
  const items: StandardAttributeDescription[] = p.value ?? []

  // All-or-nothing: если ни один реквизит не изменён — секция не печатается
  const isGroupChanged = items.some(
    (item) =>
      !isEmptyMetadataItem({
        context: p.context,
        rule: StandardAttributeDescriptionRules as any,
        element: item as any,
        ignoreKeys: ["name"],
      })
  )

  if (!isGroupChanged) return undefined

  // Expand to full canonical list from standartAttributeNames
  const standartAttributeNames: Record<string, string> = (p.rule as any).standartAttributeNames ?? {}
  const explicitByName = new Map<string, StandardAttributeDescription>()
  for (const item of items) {
    if (item.name) explicitByName.set(item.name as string, item)
  }

  const allItems: StandardAttributeDescription[] = Object.keys(standartAttributeNames).map(
    (internalName) =>
      explicitByName.get(internalName) ?? {
        itemType: "StandardAttributeDescription" as const,
        name: internalName as StandartAttributeName,
      }
  )

  return exportMetadataCollectionToXML({
    context: p.context,
    rule: p.rule,
    data: allItems,
    itemRule: StandardAttributeDescriptionRules,
    xmlElement: "xr:StandardAttribute",
    keyField: "name",
  })
}

registerMetadataItemCollectionRule({
  propertyType: "StandardAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: "xr:StandardAttribute",
  keyField: "name",
  nameFromYAMLKey: StandartAttributeNameFromYAML,
  recordYamlKeyFromItem: (item) => StandartAttributeNameToYAML[item.name as StandartAttributeName],
  fromYAML: importStandardAttributeDescriptionsFromYAML,
  fromXML: importStandardAttributeDescriptionsFromXML,
  toXML: exportStandardAttributeDescriptionsToXML,
})
