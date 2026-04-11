import { Document, isMap, isPair, isScalar } from "yaml"
import { getOrCreateRawNodeId, graph, itemTypePrefix } from "~/metadata/relations/graph"
import { getTypeRule } from "../formElement/factory"
import { MetadataItemRule } from "../property/types"

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

  for (const [, propRule] of Object.entries(rule.properties)) {
    if (!propRule.yaml) continue
    const handler = getTypeRule(propRule.type, "importDependenciesFromYAML")
    if (!handler) continue

    const pair = root.items.find(
      (item) => isPair(item) && isScalar(item.key) && item.key.value === propRule.yaml,
    )
    if (pair && isPair(pair) && isMap(pair.value)) {
      handler({ yamlMap: pair.value, parentNodeId: itemNodeId, filePath })
    }
  }
}
