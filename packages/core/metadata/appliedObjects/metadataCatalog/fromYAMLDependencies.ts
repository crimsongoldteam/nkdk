import { Document, YAMLMap, isMap, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"

function processAttributes(attrMap: YAMLMap, parentNodeId: string, filePath: string): void {
  for (const item of attrMap.items) {
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
    graph.addEdgeWithKey(edgeKey1, prefix, catalogNodeId, { yaml: "Реквизит", name: "Реквизит" })
  }

  const root = yamlDocument.contents
  if (!isMap(root)) return

  const requisitesPair = root.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === "Реквизиты",
  )
  if (requisitesPair && isPair(requisitesPair) && isMap(requisitesPair.value)) {
    processAttributes(requisitesPair.value, catalogNodeId, path)
  }

  const tabularPair = root.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === "ТабличныеЧасти",
  )
  if (tabularPair && isPair(tabularPair) && isMap(tabularPair.value)) {
    for (const item of tabularPair.value.items) {
      if (!isPair(item) || !isScalar(item.key)) continue
      const sectionName = String(item.key.value)
      const offset = item.key.range?.[0]
      const sectionNodeId = `${catalogNodeId}.ТабличнаяЧасть.${sectionName}`

      getOrCreateRawNodeId(sectionNodeId, { name: sectionName, offset, filePath: path })

      const edgeKey = `${catalogNodeId}:ТабличнаяЧасть:${sectionNodeId}`
      if (!graph.hasEdge(edgeKey)) {
        graph.addEdgeWithKey(edgeKey, catalogNodeId, sectionNodeId, { yaml: "ТабличнаяЧасть", name: "ТабличнаяЧасть" })
      }

      if (isMap(item.value)) {
        const attrsPair = item.value.items.find(
          (i) => isPair(i) && isScalar(i.key) && i.key.value === "Реквизиты",
        )
        if (attrsPair && isPair(attrsPair) && isMap(attrsPair.value)) {
          processAttributes(attrsPair.value, sectionNodeId, path)
        }
      }
    }
  }
}
