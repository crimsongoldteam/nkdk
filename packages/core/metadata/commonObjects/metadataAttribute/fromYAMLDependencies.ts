import { YAMLMap, isNode, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataAttribute } from "~/metadata/commonObjects/metadataAttribute/types"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { registerTypeRule } from "~/metadata/orchestration"
import { importMetadataAttributeFromYAML } from "./fromYAML"

function importMetadataAttributesDependenciesFromYAML(params: {
  context: ConfigurationContext
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
  parsedItem?: unknown
}): void {
  const { context, yamlMap, parentNodeId, filePath, parsedItem } = params
  if (!yamlMap) return

  const parsedAttributes = Array.isArray(parsedItem) ? (parsedItem as MetadataAttribute[]) : undefined

  for (const item of yamlMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const attrName = String(item.key.value)
    const offset = item.key.range?.[0]
    const attrNodeId = `${parentNodeId}.Реквизит.${attrName}`

    const attrItem =
      parsedAttributes?.find((a) => a.name === attrName) ??
      importMetadataAttributeFromYAML(context, isNode(item.value) ? item.value.toJSON() : item.value, attrName)

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
