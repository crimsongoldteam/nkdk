import type { MetadataGraph } from "./MetadataGraph"

/**
 * Резолвит form-local путь в NodeId целевого узла графа метаданных.
 *
 * Формат пути: "<ИмяРеквизитаФормы>.<Сегмент1>.<Сегмент2>..."
 * Первый сегмент — имя реквизита формы; каждый следующий резолвится
 * через reference-ребро «Тип» с текущего узла с конкатенацией сегмента
 * к NodeId цели «Тип»-ребра.
 *
 * Возвращает undefined, если:
 * - путь пустой
 * - реквизит формы (первый сегмент) не найден в графе
 * - «Тип»-ребро отсутствует для очередного сегмента
 * - промежуточный (не конечный) узел не существует в графе
 *
 * Если конечный узел не существует — создаётся заглушка через ensureNode,
 * возвращается stubCreated: true.
 */
export function resolveFormLocalPath(params: {
  formNodeId: string
  path: string
  graph: MetadataGraph
}): { targetId: string; stubCreated: boolean } | undefined {
  const { formNodeId, path, graph } = params

  if (!path) return undefined

  const segments = path.split(".")

  // Шаг 1: найти узел реквизита формы (первый сегмент)
  let currentNodeId = `${formNodeId}.${segments[0]}`
  if (!graph.hasNode(currentNodeId)) return undefined

  // Шаг 2: для каждого следующего сегмента — пройти по «Тип»-ребру, конкатенировать
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]

    const typeEdges = [...graph.outEdgeEntries(currentNodeId)].filter(
      (e) => e.attributes.kind === "Тип",
    )
    if (typeEdges.length === 0) return undefined

    const typeTargetId = typeEdges[0].target
    const nextNodeId = `${typeTargetId}.${segment}`

    // Промежуточный (не последний) сегмент: узел должен существовать для продолжения
    if (i < segments.length - 1 && !graph.hasNode(nextNodeId)) {
      return undefined
    }

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
