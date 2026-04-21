import { GraphOps } from "../orchestration/property/fn"
import { MetadataGraph } from "./MetadataGraph"

export interface ApplyGraphOpsContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  edgeName: string
}

/**
 * Применяет декларативный GraphOps к графу.
 *
 * - children → owned-узлы с filePath, composition-рёбра от parentNodeId
 * - references → stub-узлы (если ещё нет), reference-рёбра с positionFrom
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeName } = ctx

  for (const child of ops.children ?? []) {
    const childNodeId = `${parentNodeId}.${child.idSuffix}`
    graph.ensureNode(childNodeId, {
      name: child.name,
      filePath,
      positionFrom: child.positionFrom,
    })
    const edgeKey = `${parentNodeId}:${edgeName}:${childNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
      yaml: edgeName,
      name: edgeName,
      kind: "composition",
    })
  }

  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeKey = `${parentNodeId}:${edgeName}:${ref.id}`
    graph.ensureEdge(edgeKey, parentNodeId, ref.id, {
      yaml: edgeName,
      name: edgeName,
      kind: "reference",
      positionFrom: ref.positionFrom,
    })
  }
}
