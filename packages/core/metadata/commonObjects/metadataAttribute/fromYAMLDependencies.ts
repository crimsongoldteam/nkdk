import { YAMLMap, isNode, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { registerTypeRule } from "~/metadata/orchestration"
import { importMetadataAttributeFromYAML } from "./fromYAML"

function importMetadataAttributesDependenciesFromYAML(params: {
  context: ConfigurationContext
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
}): void {
  const { context, yamlMap, parentNodeId, filePath } = params
  if (!yamlMap) return

  for (const item of yamlMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const attrName = String(item.key.value)
    const offset = item.key.range?.[0]
    const attrNodeId = `${parentNodeId}.Реквизит.${attrName}`

    const yamlValue = isNode(item.value) ? item.value.toJSON() : item.value
    const attrItem = importMetadataAttributeFromYAML(context, yamlValue, attrName)

    getOrCreateRawNodeId(attrNodeId, {
      name: attrName,
      item: attrItem,
      positionFrom: offset !== undefined ? { offset } : undefined,
      filePath,
    })

    const edgeKey = `${parentNodeId}:Реквизит:${attrNodeId}`
    if (!graph.hasEdge(edgeKey)) {
      graph.addEdgeWithKey(edgeKey, parentNodeId, attrNodeId, { yaml: "Реквизит", name: "Реквизит" })
    }
  }
}

registerTypeRule("MetadataAttributes", "importDependenciesFromYAML", importMetadataAttributesDependenciesFromYAML)
