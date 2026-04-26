import { GraphOps } from "../orchestration/property/fn"
import { MetadataGraph } from "./MetadataGraph"

export interface ApplyGraphOpsContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  /** ASCII-метка ребра (тип отношения в Cypher и идентификатор в логике). */
  edgeKind: string
  /** Русский YAML-ключ ребра (для round-trip и человекочитаемости). */
  edgeYaml: string
}

/**
 * Применяет декларативный GraphOps к графу.
 *
 * - children → owned-узлы с filePath, owning-рёбра kind=edgeKind от parentNodeId
 * - references → stub-узлы (если ещё нет), reference-рёбра kind=edgeKind с positionFrom
 *
 * edgeKind должен быть зарегистрирован в edgeKinds:
 * - для children — owning kind
 * - для references — reference kind
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

  for (const child of ops.children ?? []) {
    const childNodeId = `${parentNodeId}.${child.idSuffix}`
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePaths: [filePath],
      positionFrom: child.positionFrom,
    })
    const edgeKey = `${parentNodeId}:${edgeKind}:${childNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
      yaml: edgeYaml,
      kind: edgeKind,
    })
  }

  for (const ref of ops.references ?? []) {
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeKey = `${parentNodeId}:${edgeKind}:${ref.id}`
    graph.ensureEdge(edgeKey, parentNodeId, ref.id, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: ref.positionFrom,
    })
  }
}
