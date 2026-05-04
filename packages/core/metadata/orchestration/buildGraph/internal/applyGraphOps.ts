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
 * - formLocalReferences → reference-рёбра, цель которых резолвится через resolveFormLocalPath
 *   (form-local путь типа "Объект.Договор.Владелец" → NodeId через обход рёбер формы);
 *   при undefined резолв ребро не создаётся; при local.parentOverride ребро идёт оттуда.
 *
 * edgeKind должен быть зарегистрирован в edgeKinds: для children — owning,
 * для references/formLocalReferences — reference.
 */
export function applyGraphOps(ops: GraphOps, ctx: ApplyGraphOpsContext): void {
  const { graph, parentNodeId, filePath, edgeKind, edgeYaml } = ctx

  for (const [index, child] of (ops.children ?? []).entries()) {
    const idParent = child.parentOverride ?? parentNodeId
    const childNodeId = child.absoluteId ?? `${idParent}.${child.idSuffix}`
    const edgeSource = child.edgeFrom ?? child.parentOverride ?? parentNodeId

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
    graph.ensureNode(ref.id, { name: ref.name })
    const edgeAttrs: Record<string, unknown> = { yaml: edgeYaml }
    if (ref.positionFrom !== undefined) edgeAttrs.positionFrom = ref.positionFrom
    graph.ensureEdge(parentNodeId, ref.id, edgeKind, edgeAttrs)
  }

  for (const local of ops.formLocalReferences ?? []) {
    const effectiveParent = local.parentOverride ?? parentNodeId
    const targetId = resolveFormLocalPath(graph, local.formNodeId, local.formLocalPath)
    if (targetId === undefined) continue
    const edgeAttrs: Record<string, unknown> = { yaml: edgeYaml }
    if (local.positionFrom !== undefined) edgeAttrs.positionFrom = local.positionFrom
    graph.ensureEdge(effectiveParent, targetId, edgeKind, edgeAttrs)
  }
}

// Form-local resolver inline: первый сегмент — обход рёбер формы по kind,
// дальше — обход через TYPE-ребро с попыткой найти дочерний узел по name
// и fallback-конкатенацией. Существование промежуточных узлов обязательно;
// конечный отсутствующий узел создаётся как stub.
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
    const nextNodeId = childByEdge ?? `${typeTargetId}.${segment}`

    if (i < segments.length - 1 && !graph.hasNode(nextNodeId)) return undefined

    currentNodeId = nextNodeId
  }

  if (!graph.hasNode(currentNodeId)) {
    const name = currentNodeId.split(".").pop() ?? currentNodeId
    graph.ensureNode(currentNodeId, { name })
  }
  return currentNodeId
}
