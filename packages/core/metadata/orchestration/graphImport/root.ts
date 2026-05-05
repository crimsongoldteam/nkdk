import { getKindByYaml } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function declareMetadataItemGraphRoot(params: {
  graph: GraphBuilder
  rule: MetadataItemRule
  name: string
  filePath: string
}): string {
  const { graph, rule, name, filePath } = params
  if (!rule.itemTypePrefix) {
    throw new Error(`declareMetadataItemGraphRoot: правило "${rule.itemType}" не задаёт itemTypePrefix`)
  }

  const itemNodeId = `${rule.itemTypePrefix}.${name}`
  graph.ensureNode(rule.itemTypePrefix, { name: rule.itemTypePrefix })
  graph.ensureNode(itemNodeId, { name })
  graph.addFilePath(itemNodeId, filePath)

  const edgeKind = getKindByYaml(rule.itemType) ?? rule.itemType
  graph.ensureEdge(rule.itemTypePrefix, itemNodeId, edgeKind, { yaml: rule.itemType })
  materializeGraphTerminals({ graph, rule, itemNodeId, ownerName: name, filePath })
  return itemNodeId
}

function materializeGraphTerminals(params: {
  graph: GraphBuilder
  rule: MetadataItemRule
  itemNodeId: string
  ownerName: string
  filePath: string
}): void {
  const { graph, rule, itemNodeId, ownerName, filePath } = params
  if (!rule.graphTerminals?.length) return

  const ownerType = rule.itemTypePrefix ?? ""
  for (const terminalName of rule.graphTerminals) {
    const terminalId = `${itemNodeId}.${terminalName}`
    graph.ensureNode(terminalId, { name: terminalName })
    graph.addFilePath(terminalId, filePath)
    graph.setItem(terminalId, { itemType: "EmptyRef", ownerType, ownerName })

    const edgeKind = getKindByYaml(terminalName) ?? terminalName
    graph.ensureEdge(itemNodeId, terminalId, edgeKind, { yaml: terminalName })
  }
}
