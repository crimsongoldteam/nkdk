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
 * - children → owned-узлы с filePath, owning-рёбра kind=edgeName от parentNodeId
 * - references → stub-узлы (если ещё нет), reference-рёбра kind=edgeName с positionFrom
 *
 * edgeName должен быть зарегистрирован в edgeKinds:
 * - для children — owning kind
 * - для references — reference kind
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeName } = ctx

  for (const child of ops.children ?? []) {
    const childNodeId = `${parentNodeId}.${child.idSuffix}`
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePath,
      positionFrom: child.positionFrom,
    })
    const edgeKey = `${parentNodeId}:${edgeName}:${childNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
      yaml: edgeName,
      kind: edgeName,
    })
  }

  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeKey = `${parentNodeId}:${edgeName}:${ref.id}`
    graph.ensureEdge(edgeKey, parentNodeId, ref.id, {
      yaml: edgeName,
      kind: edgeName,
      positionFrom: ref.positionFrom,
    })
  }
}
