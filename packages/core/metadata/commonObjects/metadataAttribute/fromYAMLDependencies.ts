import { YAMLMap, isPair, isScalar } from "yaml"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { registerTypeRule } from "~/metadata/orchestration"

function importMetadataAttributesDependenciesFromYAML(params: {
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
}): void {
  const { yamlMap, parentNodeId, filePath } = params
  if (!yamlMap) return

  for (const item of yamlMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const attrName = String(item.key.value)
    const offset = item.key.range?.[0]
    const attrNodeId = `${parentNodeId}.Реквизит.${attrName}`

    getOrCreateRawNodeId(attrNodeId, { name: attrName, offset, filePath })

    const edgeKey = `${parentNodeId}:Реквизит:${attrNodeId}`
    if (!graph.hasEdge(edgeKey)) {
      graph.addEdgeWithKey(edgeKey, parentNodeId, attrNodeId, { yaml: "Реквизит", name: "Реквизит" })
    }
  }
}

registerTypeRule("MetadataAttributes", "importDependenciesFromYAML", importMetadataAttributesDependenciesFromYAML)
