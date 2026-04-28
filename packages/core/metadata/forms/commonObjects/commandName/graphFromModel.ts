/**
 * Регистрирует buildGraphFromModel для типа CommandName.
 *
 * PRD #121: свойство commandName на кнопках формы — имя команды в текущей форме.
 * Материализуется как reference-ребро «ИмяКоманды» от узла кнопки к узлу команды формы.
 *
 * Если команды с таким именем нет в форме — создаётся заглушка через ensureNode
 * в applyGraphOps. formNodeId пробрасывается через extra от forms/elements.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

const EDGE_KIND = "COMMAND_NAME"
const EDGE_YAML = "ИмяКоманды"

registerEdgeKind(EDGE_KIND, { yaml: EDGE_YAML, owning: false })

const buildCommandNameGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const targetId = `${formNodeId}.Команда.${model}`
  return {
    references: [{ id: targetId, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}

registerTypeRule("CommandName", "buildGraphFromModel", buildCommandNameGraph)
