/**
 * Регистрирует buildGraphFromModel для типа DataPath.
 *
 * PRD #118: dataPath-свойства элементов формы превращаются в reference-рёбра
 * от узла элемента к узлу целевого реквизита/колонки.
 *
 * Kind ребра определяется по правилу yaml-name (PRD #114):
 * propRule.graphEdgeKind ?? getKindByYaml(propRule.yaml).
 *
 * Резолвинг цели делегирован applyGraphOps через formLocalReferences —
 * оркестратор вызовет resolveFormLocalPath при записи в граф.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { getKindByYaml, registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

registerEdgeKind("DATA_PATH", { yaml: "ПутьКДанным", owning: false })
registerEdgeKind("FOOTER_DATA_PATH", { yaml: "ПутьКДаннымПодвала", owning: false })
registerEdgeKind("TITLE_DATA_PATH", { yaml: "ПутьКДаннымЗаголовка", owning: false })
registerEdgeKind("ROW_PICTURE_DATA_PATH", { yaml: "ПутьКДаннымКартинкиСтроки", owning: false })

const buildDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  propRule,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  const edgeYaml = propRule.yaml
  if (!edgeYaml) return undefined
  const edgeKind =
    ((propRule as Record<string, unknown>).graphEdgeKind as string | undefined) ??
    getKindByYaml(edgeYaml)
  if (!edgeKind) return undefined

  return {
    formLocalReferences: [{ formLocalPath: model, formNodeId }],
    edgeKind,
    edgeYaml,
  }
}

registerTypeRule("DataPath", "buildGraphFromModel", buildDataPathGraph)
