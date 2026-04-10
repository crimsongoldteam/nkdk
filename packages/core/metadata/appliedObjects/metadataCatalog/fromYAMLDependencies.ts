import { Document, isMap, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"

export function importMetadataCatalogDependenciesFromYAML(params: {
  context: ConfigurationContext
  yamlDocument: Document
  path: string
  name: string
}): void {
  const { yamlDocument, path, name } = params
  const prefix = "Справочник"
  const catalogNodeId = `${prefix}.${name}`

  getOrCreateRawNodeId(prefix, { name: prefix })
  getOrCreateRawNodeId(catalogNodeId, { name, filePath: path })

  const edgeKey1 = `${prefix}:Реквизит:${catalogNodeId}`
  if (!graph.hasEdge(edgeKey1)) {
    graph.addEdgeWithKey(edgeKey1, prefix, catalogNodeId, { yaml: "Реквизит" })
  }

  const root = yamlDocument.contents
  if (!isMap(root)) return

  const requisitesPair = root.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === "Реквизиты",
  )
  if (!requisitesPair || !isPair(requisitesPair) || !isMap(requisitesPair.value)) return

  for (const item of requisitesPair.value.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const attrName = String(item.key.value)
    const offset = item.key.range?.[0]
    const attrNodeId = `${catalogNodeId}.${attrName}`

    getOrCreateRawNodeId(attrNodeId, { name: attrName, offset, filePath: path })

    const edgeKey2 = `${catalogNodeId}:Реквизит:${attrNodeId}`
    if (!graph.hasEdge(edgeKey2)) {
      graph.addEdgeWithKey(edgeKey2, catalogNodeId, attrNodeId, { yaml: "Реквизит" })
    }
  }
}
