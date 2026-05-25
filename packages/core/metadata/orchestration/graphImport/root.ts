import {
  canonicalizeMetadataGraphPath,
  canonicalizeMetadataValueGraphPath,
} from "~/metadata/commonObjects/metadataPath/graphPath"
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

  const rootNodeId = canonicalizeMetadataGraphPath(rule.itemTypePrefix)
  const itemNodeId = `${rootNodeId}.${name}`
  graph.ensureNode(rootNodeId, { name: rule.itemTypePrefix })
  graph.ensureNode(itemNodeId, { name })
  graph.addFilePath(itemNodeId, filePath)

  const edgeKind = getKindByYaml(rule.itemType) ?? rule.itemType
  graph.ensureEdge(rootNodeId, itemNodeId, edgeKind, { yaml: rule.itemType })
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
    const terminalId =
      terminalName === "ПустаяСсылка"
        ? `${itemNodeId}.EmptyRef`
        : canonicalizeMetadataValueGraphPath(`${itemNodeId}.${terminalName}`)
    const terminalNodeName = terminalId.split(".").pop() ?? terminalName
    graph.ensureNode(terminalId, { name: terminalNodeName })
    graph.addFilePath(terminalId, filePath)
    graph.setItem(terminalId, { itemType: "EmptyRef", ownerType, ownerName })

    const edgeKind = getKindByYaml(terminalName) ?? terminalName
    graph.ensureEdge(itemNodeId, terminalId, edgeKind, { yaml: terminalName })
  }
}
