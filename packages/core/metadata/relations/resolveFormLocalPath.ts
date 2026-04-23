import type { MetadataGraph } from "./MetadataGraph"

/**
 * Резолвит form-local путь в NodeId целевого узла графа метаданных.
 *
 * Формат пути: "<ИмяРеквизитаФормы>.<Сегмент1>.<Сегмент2>..."
 * Первый сегмент — ищется через обход исходящих рёбер формы по kind
 * (РеквизитФормы, КомандаФормы, ПараметрФормы, ЭлементФормы) с совпадением
 * по атрибуту name целевого узла.
 * Каждый следующий сегмент резолвится через reference-ребро «Тип» с текущего
 * узла: сначала пытается найти дочерний узел по name через обход рёбер,
 * при неудаче — fallback-конкатенация к nodeId цели «Тип»-ребра.
 *
 * Возвращает undefined, если:
 * - путь пустой
 * - реквизит/команда/параметр/элемент формы (первый сегмент) не найден
 * - «Тип»-ребро отсутствует для очередного сегмента
 * - промежуточный (не конечный) узел не существует в графе
 *
 * Если конечный узел не существует — создаётся заглушка через ensureNode,
 * возвращается stubCreated: true.
 */

const FORM_CHILD_KINDS = new Set([
  "РеквизитФормы",
  "КомандаФормы",
  "ПараметрФормы",
  "ЭлементФормы",
])

function findChildByName(graph: MetadataGraph, parentNodeId: string, name: string): string | undefined {
  for (const { target } of graph.outEdgeEntries(parentNodeId)) {
    if (graph.getNodeAttribute(target, "name") === name) return target
  }
  return undefined
}

export function resolveFormLocalPath(params: {
  formNodeId: string
  path: string
  graph: MetadataGraph
}): { targetId: string; stubCreated: boolean } | undefined {
  const { formNodeId, path, graph } = params

  if (!path) return undefined
  if (!graph.hasNode(formNodeId)) return undefined

  const segments = path.split(".")

  // Шаг 1: найти узел первого сегмента через обход рёбер формы по kind
  let currentNodeId: string | undefined
  for (const { attributes, target } of graph.outEdgeEntries(formNodeId)) {
    if (
      FORM_CHILD_KINDS.has(attributes.kind) &&
      graph.getNodeAttribute(target, "name") === segments[0]
    ) {
      currentNodeId = target
      break
    }
  }
  if (currentNodeId === undefined) return undefined

  // Шаг 2: для каждого следующего сегмента — пройти по «Тип»-ребру,
  // найти дочерний узел по name (edge-traversal), fallback — конкатенация.
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]

    // Найти «Тип»-ребро
    let typeTargetId: string | undefined
    for (const { attributes, target } of graph.outEdgeEntries(currentNodeId)) {
      if (attributes.kind === "Тип") { typeTargetId = target; break }
    }
    if (typeTargetId === undefined) return undefined

    // Попытка найти дочерний узел по name
    const childByEdge = findChildByName(graph, typeTargetId, segment)
    const nextNodeId = childByEdge ?? `${typeTargetId}.${segment}`

    // Промежуточный (не последний) сегмент: узел должен существовать
    if (i < segments.length - 1 && !graph.hasNode(nextNodeId)) return undefined

    currentNodeId = nextNodeId
  }

  // Шаг 3: если конечного узла нет — создать заглушку
  if (!graph.hasNode(currentNodeId)) {
    const name = currentNodeId.split(".").pop() ?? currentNodeId
    graph.ensureNode(currentNodeId, { name })
    return { targetId: currentNodeId, stubCreated: true }
  }

  return { targetId: currentNodeId, stubCreated: false }
}
