/**
 * Регистрирует buildGraphFromModel для типа DataPath.
 *
 * PRD #118: dataPath-свойства элементов формы превращаются в reference-рёбра
 * от узла элемента к узлу целевого реквизита/колонки.
 *
 * Kind ребра определяется по правилу yaml-name (PRD #114):
 * propRule.graphEdgeKind ?? propRule.yaml:
 * - dataPath     → ПутьКДанным
 * - footerDataPath → ПутьКДаннымПодвала
 * - titleDataPath  → ПутьКДаннымЗаголовка
 * - rowPictureDataPath → ПутьКДаннымКартинкиСтроки
 *
 * При отсутствии первого сегмента (невалидное имя реквизита формы) →
 * resolveFormLocalPath вернёт undefined → ребро не создаётся, стаб не создаётся.
 * При валидном первом сегменте, но отсутствующем конечном узле →
 * resolveFormLocalPath создаёт заглушку, ребро ведёт на заглушку.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { getKindByYaml, registerEdgeKind } from "~/metadata/relations/edgeKinds"
import { resolveFormLocalPath } from "~/metadata/relations/resolveFormLocalPath"

// Reference-виды рёбер dataPath-свойств (PRD #118).
// Зарегистрированы централизованно в edgeKinds.ts; повторные registerEdgeKind
// здесь — идемпотентная страховка на случай, если порядок импортов отличается.
registerEdgeKind("DATA_PATH", { yaml: "ПутьКДанным", owning: false })
registerEdgeKind("FOOTER_DATA_PATH", { yaml: "ПутьКДаннымПодвала", owning: false })
registerEdgeKind("TITLE_DATA_PATH", { yaml: "ПутьКДаннымЗаголовка", owning: false })
registerEdgeKind("ROW_PICTURE_DATA_PATH", { yaml: "ПутьКДаннымКартинкиСтроки", owning: false })

registerTypeRule("DataPath", "buildGraphFromModel", ({ model, parentNodeId, propRule, graph, extra }) => {
  if (typeof model !== "string" || !model) return

  // formNodeId пробрасывается через extra от buildElementChildrenGraph
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return

  // edgeYaml — русский YAML-ключ свойства; edgeKind вычисляется через перевод
  const edgeYaml = propRule.yaml
  if (!edgeYaml) return
  const edgeKind =
    ((propRule as Record<string, unknown>).graphEdgeKind as string | undefined) ??
    getKindByYaml(edgeYaml)
  if (!edgeKind) return

  const resolved = resolveFormLocalPath({ formNodeId, path: model, graph })
  if (!resolved) return

  const edgeKey = `${parentNodeId}:${edgeKind}:${resolved.targetId}`
  graph.ensureEdge(edgeKey, parentNodeId, resolved.targetId, {
    yaml: edgeYaml,
    kind: edgeKind,
  })
})
