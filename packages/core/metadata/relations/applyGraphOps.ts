import { GraphOps } from "../orchestration/property/fn"
import { resolveFormLocalPath } from "./resolveFormLocalPath"
import { MetadataGraph } from "./MetadataGraph"

export interface ApplyGraphOpsContext {
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
  edgeKind: string
  edgeYaml: string
}

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

  for (const local of ops.formLocalReferences ?? []) {
    const resolved = resolveFormLocalPath({
      formNodeId: local.formNodeId,
      path: local.formLocalPath,
      graph,
    })
    if (!resolved) continue
    const edgeKey = `${parentNodeId}:${edgeKind}:${resolved.targetId}`
    graph.ensureEdge(edgeKey, parentNodeId, resolved.targetId, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: local.positionFrom,
    })
  }
}
