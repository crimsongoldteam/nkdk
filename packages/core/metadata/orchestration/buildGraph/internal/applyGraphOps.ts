import {
  canonicalizeGraphChildIdSuffix,
  canonicalizeGraphNodeId,
  canonicalizeRuntimeObjectPath,
  type RuntimeChildKind,
} from "~/metadata/commonObjects/metadataPath/graphPath"
import { GraphOps } from "~/metadata/orchestration/property/fn"
import { GraphBuilder } from "./GraphBuilder"

export interface ApplyGraphOpsContext {
  graph: GraphBuilder
  parentNodeId: string
  filePath: string
  edgeKind: string
  edgeYaml: string
}

/**
 * Применяет декларативный GraphOps к графу.
 *
 * - children → owned-узлы с filePath, owning-рёбра kind=edgeKind.
 *   childNodeId = child.absoluteId, если задано;
 *   иначе `${child.parentOverride ?? ctx.parentNodeId}.${child.idSuffix}`.
 *   Источник ребра = child.edgeFrom ?? child.parentOverride ?? ctx.parentNodeId.
 *   При повторном child.item на уже заполненном узле бросает конфликт itemType.
 * - references → stub-узлы (если ещё нет), reference-рёбра kind=edgeKind с positionFrom.
 * - formLocalReferences → reference-рёбра, цель которых резолвится через локальные источники формы.
 *
 * edgeKind должен быть зарегистрирован в edgeKinds: для children — owning,
 * для references/formLocalReferences — reference.
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

  for (const [index, child] of (ops.children ?? []).entries()) {
    const idParent = canonicalizeGraphNodeId(child.parentOverride ?? parentNodeId)
    const childNodeId = child.absoluteId
      ? canonicalizeGraphNodeId(child.absoluteId)
      : `${idParent}.${canonicalizeGraphChildIdSuffix(child.idSuffix)}`
    const edgeSource = canonicalizeGraphNodeId(child.edgeFrom ?? child.parentOverride ?? parentNodeId)

    // Снимок item ДО ensureNode/setItem, чтобы детектить конфликт itemType.
    const existingItem = graph.hasNode(childNodeId)
      ? graph.getNodeAttributes(childNodeId).item
      : undefined

    graph.ensureNode(childNodeId, { name: child.name })
    graph.addFilePath(childNodeId, filePath)

    if (child.item !== undefined) {
      if (existingItem === undefined) {
        graph.setItem(childNodeId, child.item)
      } else {
        const existingItemType = (existingItem as Record<string, unknown>).itemType
        const newItemType = (child.item as Record<string, unknown>).itemType
        if (
          existingItemType !== undefined &&
          newItemType !== undefined &&
          existingItemType !== newItemType
        ) {
          throw new Error(
            `applyGraphOps: конфликт itemType на узле "${childNodeId}": ` +
              `существующий="${String(existingItemType)}", новый="${String(newItemType)}"`,
          )
        }
      }
    }

    graph.ensureEdge(edgeSource, childNodeId, edgeKind, { yaml: edgeYaml, index: child.index ?? index })
  }

  for (const ref of ops.references ?? []) {
    const sourceNodeId = canonicalizeGraphNodeId(ref.parentOverride ?? parentNodeId)
    const targetNodeId = canonicalizeGraphNodeId(ref.id)
    graph.ensureNode(targetNodeId, { name: ref.name })
    const edgeAttrs: Record<string, unknown> = { ...sanitizeEdgeProps(ref.edgeProps), yaml: edgeYaml }
    if (ref.positionFrom !== undefined) edgeAttrs.positionFrom = ref.positionFrom
    graph.ensureEdge(sourceNodeId, targetNodeId, edgeKind, edgeAttrs)
  }

  for (const local of ops.formLocalReferences ?? []) {
    const sourceNodeId = canonicalizeGraphNodeId(local.parentOverride ?? parentNodeId)
    const targetNodeId = resolveFormLocalPath(
      graph,
      canonicalizeGraphNodeId(local.formNodeId),
      local.formLocalPath,
      local.fallbackChildKind,
    )
    if (targetNodeId === undefined) continue

    const edgeAttrs: Record<string, unknown> = { ...sanitizeEdgeProps(local.edgeProps), yaml: edgeYaml }
    if (local.positionFrom !== undefined) edgeAttrs.positionFrom = local.positionFrom
    graph.ensureEdge(sourceNodeId, targetNodeId, edgeKind, edgeAttrs)
  }
}

const SERVICE_EDGE_PROP_KEYS = new Set(["kind", "yaml", "filePath", "positionFrom"])

function sanitizeEdgeProps(edgeProps?: Record<string, unknown>): Record<string, unknown> {
  if (edgeProps === undefined) return {}

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(edgeProps)) {
    if (!SERVICE_EDGE_PROP_KEYS.has(key)) result[key] = value
  }
  return result
}

const FORM_CHILD_KINDS = new Set(["FORM_ATTRIBUTE", "FORM_COMMAND", "FORM_PARAMETER", "FORM_ELEMENT"])

function findChildByName(
  graph: GraphBuilder,
  parentNodeId: string,
  name: string,
): string | undefined {
  for (const { target } of graph.outEdgeEntries(parentNodeId)) {
    if (graph.hasNode(target) && graph.getNodeAttributes(target).name === name) return target
  }
  return undefined
}

function resolveFormLocalPath(
  graph: GraphBuilder,
  formNodeId: string,
  path: string,
  fallbackChildKind?: RuntimeChildKind,
): string | undefined {
  if (!path) return undefined
  if (!graph.hasNode(formNodeId)) return undefined

  const segments = path.split(".")
  let currentNodeId: string | undefined
  for (const { attributes, target } of graph.outEdgeEntries(formNodeId)) {
    if (
      FORM_CHILD_KINDS.has(attributes.kind) &&
      graph.hasNode(target) &&
      graph.getNodeAttributes(target).name === segments[0]
    ) {
      currentNodeId = target
      break
    }
  }
  if (currentNodeId === undefined) return undefined

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]!
    let typeTargetId: string | undefined
    for (const { attributes, target } of graph.outEdgeEntries(currentNodeId)) {
      if (attributes.kind === "TYPE") {
        typeTargetId = target
        break
      }
    }
    if (typeTargetId === undefined) return undefined

    const childByEdge = findChildByName(graph, typeTargetId, segment)
    const nextNodeId =
      childByEdge ??
      canonicalizeRuntimeObjectPath(`${typeTargetId}.${segment}`, {
        defaultChildKind: fallbackChildKind,
      })

    if (i < segments.length - 1 && !graph.hasNode(nextNodeId)) return undefined
    currentNodeId = nextNodeId
  }

  if (!graph.hasNode(currentNodeId)) {
    const name = currentNodeId.split(".").pop() ?? currentNodeId
    graph.ensureNode(currentNodeId, { name })
  }

  return currentNodeId
}
