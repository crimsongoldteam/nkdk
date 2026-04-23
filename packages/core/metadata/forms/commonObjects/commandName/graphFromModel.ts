/**
 * Регистрирует buildGraphFromModel для типа CommandName.
 *
 * PRD #121: свойство commandName на кнопках формы — имя команды в текущей форме.
 * Материализуется как reference-ребро «ИмяКоманды» от узла кнопки к узлу команды формы.
 *
 * Если команды с таким именем нет в форме — создаётся заглушка.
 * formNodeId пробрасывается через extra от buildElementChildrenGraph.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"

const EDGE_KIND = "ИмяКоманды"

registerEdgeKind(EDGE_KIND, { owning: false })

registerTypeRule("CommandName", "buildGraphFromModel", ({ model, parentNodeId, graph, extra }) => {
  if (typeof model !== "string" || !model) return

  // formNodeId пробрасывается через extra от buildElementChildrenGraph
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return

  const targetId = `${formNodeId}.Команда.${model}`

  // Создаём заглушку, если команда ещё не зарегистрирована в форме
  graph.ensureNode(targetId, { name: model })

  const edgeKey = `${parentNodeId}:${EDGE_KIND}:${targetId}`
  graph.ensureEdge(edgeKey, parentNodeId, targetId, {
    yaml: EDGE_KIND,
    kind: EDGE_KIND,
  })
})
