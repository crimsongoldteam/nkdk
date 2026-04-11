import { Document, YAMLMap, isMap, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOrCreateRawNodeId, graph, itemTypePrefix } from "~/metadata/relations/graph"
import { getTypeRule } from "../formElement/factory"
import { MetadataItemRule } from "../property/types"

export function importMetadataItemPropertiesDependenciesFromYAML(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  yamlMap: YAMLMap
  parentNodeId: string
  filePath: string
  parsedItem?: unknown
}): void {
  const { context, rule, yamlMap, parentNodeId, filePath, parsedItem } = params

  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (!propRule.yaml) continue
    const handler = getTypeRule(propRule.type, "importDependenciesFromYAML")
    if (!handler) continue

    const pair = yamlMap.items.find(
      (item) => isPair(item) && isScalar(item.key) && item.key.value === propRule.yaml,
    )
    const propYamlMap = pair && isPair(pair) && isMap(pair.value) ? pair.value : undefined
    const parsedPropValue = (parsedItem as Record<string, unknown> | undefined)?.[key]
    handler({ context, yamlMap: propYamlMap, parentNodeId, filePath, propRule, parsedItem: parsedPropValue })
  }
}

export function importMetadataItemDependenciesFromYAML(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  yamlDocument: Document
  name: string
  filePath: string
  parsedItem?: unknown
}): void {
  const { context, rule, yamlDocument, name, filePath, parsedItem } = params

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

  importMetadataItemPropertiesDependenciesFromYAML({ context, rule, yamlMap: root, parentNodeId: itemNodeId, filePath, parsedItem })
}
