/**
 * Регистрирует buildGraphFromModel для типа AssociatedTable.
 *
 * PRD #119: свойство table на элементах формы и командах формы — ссылка на
 * элемент-таблицу внутри той же формы (по имени элемента). Материализуется как
 * reference-ребро «СвязаннаяТаблица» от узла элемента к узлу таблицы.
 *
 * Если узел таблицы не существует — applyGraphOps создаст заглушку.
 * formNodeId пробрасывается через extra от forms/elements.
 */

import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

const EDGE_KIND = "ASSOCIATED_TABLE"
const EDGE_YAML = "СвязаннаяТаблица"

registerEdgeKind(EDGE_KIND, { yaml: EDGE_YAML, owning: false })

const buildAssociatedTableGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const targetId = `${formNodeId}.Element.${model}`
  return {
    references: [{ id: targetId, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}

registerTypeRule("AssociatedTable", "buildGraphFromModel", buildAssociatedTableGraph)
