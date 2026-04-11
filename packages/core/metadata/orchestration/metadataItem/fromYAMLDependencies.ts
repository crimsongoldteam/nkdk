import { Document, YAMLMap, isMap, isPair, isScalar } from "yaml"
import { getOrCreateRawNodeId, graph, itemTypePrefix } from "~/metadata/relations/graph"
import { getTypeRule } from "../formElement/factory"
import { MetadataItemRule } from "../property/types"

export function importMetadataItemPropertiesDependenciesFromYAML(params: {
  rule: MetadataItemRule
  yamlMap: YAMLMap
  parentNodeId: string
  filePath: string
}): void {
  const { rule, yamlMap, parentNodeId, filePath } = params

  for (const [, propRule] of Object.entries(rule.properties)) {
    if (!propRule.yaml) continue
    const handler = getTypeRule(propRule.type, "importDependenciesFromYAML")
    if (!handler) continue

    const pair = yamlMap.items.find(
      (item) => isPair(item) && isScalar(item.key) && item.key.value === propRule.yaml,
    )
    const propYamlMap = pair && isPair(pair) && isMap(pair.value) ? pair.value : undefined
    const standartAttributeNames =
      "standartAttributeNames" in propRule ? (propRule.standartAttributeNames as Record<string, string>) : undefined
    handler({ yamlMap: propYamlMap, parentNodeId, filePath, standartAttributeNames })
  }
}

export function importMetadataItemDependenciesFromYAML(params: {
  rule: MetadataItemRule
  yamlDocument: Document
  name: string
  filePath: string
}): void {
  const { rule, yamlDocument, name, filePath } = params

  const prefix = itemTypePrefix[rule.itemType] ?? rule.itemType
  getOrCreateRawNodeId(prefix, { name: prefix })
  const itemNodeId = `${prefix}.${name}`
  getOrCreateRawNodeId(itemNodeId, { name, filePath })

  const edgeKey = `${prefix}:${rule.itemType}:${itemNodeId}`
  if (!graph.hasEdge(edgeKey)) {
    graph.addEdgeWithKey(edgeKey, prefix, itemNodeId, { yaml: rule.itemType, name: rule.itemType })
  }

  const root = yamlDocument.contents
  if (!isMap(root)) return

  importMetadataItemPropertiesDependenciesFromYAML({ rule, yamlMap: root, parentNodeId: itemNodeId, filePath })
}
