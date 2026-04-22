import { YAMLMap } from "yaml"
import { ConfigurationContext, ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { isEmptyMetadataItem } from "~/metadata/orchestration/formElement/helper"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "~/metadata/orchestration/property/types"
import { findKeyOffset, findSubmap } from "~/metadata/orchestration/property/position"
import { StandardAttributeDescriptionRules } from "./rules"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"
import type { StandardAttributeDescription } from "./types"

const EDGE_NAME = "СтандартныйРеквизит"

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

function buildStandardAttributesGraph(params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  graph: MetadataGraph
}): void {
  const { model, parentNodeId, filePath, yamlMap, propRule, graph } = params
  const stdAttrRule = propRule as StandardAttributeDescriptionsPropertyRule
  if (!stdAttrRule.standartAttributeNames) return

  const stdAttrsYamlMap = propRule.yaml ? findSubmap(yamlMap, propRule.yaml) : undefined
  const result = model as readonly StandardAttributeDescription[] | undefined

  // Build map of explicitly defined items (russianName → item)
  const explicitItems = new Map<string, StandardAttributeDescription>()
  if (result) {
    for (const item of result) {
      const russianName = StandartAttributeNameToYAML[item.name as StandartAttributeName]
      if (russianName) explicitItems.set(russianName, item)
    }
  }

  for (const [internalName, russianName] of Object.entries(stdAttrRule.standartAttributeNames)) {
    const nodeId = `${parentNodeId}.${russianName}`
    const offset = stdAttrsYamlMap ? findKeyOffset(stdAttrsYamlMap, russianName) : undefined

    // US 13: standard attributes always have item so they are never treated as stubs
    const item = explicitItems.get(russianName) ?? {
      itemType: "StandardAttributeDescription" as const,
      name: internalName,
    }
    graph.promoteNode(nodeId, {
      name: russianName,
      positionFrom: offset !== undefined ? { offset } : undefined,
      filePath,
      item,
    })

    const edgeKey = `${parentNodeId}:${EDGE_NAME}:${russianName}`
    graph.ensureEdge(edgeKey, parentNodeId, nodeId, { yaml: EDGE_NAME, kind: EDGE_NAME })
  }
}

function importStandardAttributeDescriptionsFromYAML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: any
) {
  return importMetadataItemCollectionFromYAMLAsRecord({
    context,
    itemRule: StandardAttributeDescriptionRules,
    yaml: value,
    nameFromYAMLKey: StandartAttributeNameFromYAML,
  }) as StandardAttributeDescription[] | undefined
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

registerTypeRule("StandardAttributeDescriptions", "buildGraphFromModel", buildStandardAttributesGraph)
