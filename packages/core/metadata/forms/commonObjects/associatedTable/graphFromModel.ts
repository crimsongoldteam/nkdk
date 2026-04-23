/**
 * Регистрирует buildGraphFromModel для типа AssociatedTable.
 *
 * PRD #119: свойство table на элементах формы и командах формы — ссылка на
 * элемент-таблицу внутри той же формы (по имени элемента). Материализуется как
 * reference-ребро «СвязаннаяТаблица» от узла элемента к узлу таблицы.
 *
 * Если узел таблицы не существует в графе — создаётся заглушка (без filePaths).
 * formNodeId пробрасывается через extra от buildElementChildrenGraph.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"

const EDGE_KIND = "СвязаннаяТаблица"

registerEdgeKind(EDGE_KIND, { owning: false })

registerTypeRule("AssociatedTable", "buildGraphFromModel", ({ model, parentNodeId, graph, extra }) => {
  if (typeof model !== "string" || !model) return

  // formNodeId пробрасывается через extra от buildElementChildrenGraph
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return

  const targetId = `${formNodeId}.Элемент.${model}`

  // Создаём заглушку, если элемент-таблица ещё не зарегистрирован
  graph.ensureNode(targetId, { name: model })

  const edgeKey = `${parentNodeId}:${EDGE_KIND}:${targetId}`
  graph.ensureEdge(edgeKey, parentNodeId, targetId, {
    yaml: EDGE_KIND,
    kind: EDGE_KIND,
  })
})
