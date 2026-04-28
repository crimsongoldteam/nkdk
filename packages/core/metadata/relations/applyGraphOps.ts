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

/**
 * Применяет декларативный GraphOps к графу.
 *
 * - children → owned-узлы с filePath, owning-рёбра kind=edgeKind от parentNodeId
 *   (или от child.parentOverride, если задано — childNodeId формируется относительно него)
 * - references → stub-узлы (если ещё нет), reference-рёбра kind=edgeKind с positionFrom
 * - formLocalReferences → reference-рёбра, цель которых резолвится через resolveFormLocalPath
 *   (form-local путь типа "Объект.Договор.Владелец" → NodeId через обход рёбер формы);
 *   при `resolveFormLocalPath → undefined` ребро не создаётся
 *   (или от local.parentOverride, если задано — ребро идёт оттуда)
 *
 * edgeKind должен быть зарегистрирован в edgeKinds: для children — owning, для references/formLocalReferences — reference.
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

  for (const child of ops.children ?? []) {
    const effectiveParent = child.parentOverride ?? parentNodeId
    const childNodeId = `${effectiveParent}.${child.idSuffix}`
    graph.promoteNode(childNodeId, {
      name: child.name,
      filePaths: [filePath],
      positionFrom: child.positionFrom,
      item: child.item,
    })
    const edgeKey = `${effectiveParent}:${edgeKind}:${childNodeId}`
    graph.ensureEdge(edgeKey, effectiveParent, childNodeId, {
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
    const effectiveParent = local.parentOverride ?? parentNodeId
    const resolved = resolveFormLocalPath({
      formNodeId: local.formNodeId,
      path: local.formLocalPath,
      graph,
    })
    if (!resolved) continue
    const edgeKey = `${effectiveParent}:${edgeKind}:${resolved.targetId}`
    graph.ensureEdge(edgeKey, effectiveParent, resolved.targetId, {
      yaml: edgeYaml,
      kind: edgeKind,
      positionFrom: local.positionFrom,
    })
  }
}
