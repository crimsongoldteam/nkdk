/**
 * Регистрирует buildGraphFromModel для типа DataPath.
 *
 * PRD #118: dataPath-свойства элементов формы превращаются в reference-рёбра
 * от узла элемента к узлу целевого реквизита/колонки.
 *
 * Резолвинг цели делегирован applyGraphOps через formLocalReferences —
 * оркестратор вызовет resolveFormLocalPath при записи в граф.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"
import { buildDataPathGraphOps } from "./graphOps"

registerEdgeKind("DATA_PATH", { yaml: "ПутьКДанным", owning: false })

const buildDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  propRule,
  propertyName,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined

  const edgeYaml = propRule.yaml
  if (!edgeYaml) return undefined

  return buildDataPathGraphOps({
    sourcePath: model,
    propertyName,
    edgeYaml,
    formNodeId: extra?.formNodeId as string | undefined,
  })
}

registerTypeRule("DataPath", "buildGraphFromModel", buildDataPathGraph)
