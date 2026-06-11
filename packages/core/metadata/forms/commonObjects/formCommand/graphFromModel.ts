/**
 * Регистрирует graphChild для коллекции FormCommands:
 * при построении графа формы каждая команда становится дочерним узлом
 * с owning-ребром «КомандаФормы».
 *
 * PRD #121.
 */

import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import { FormCommandRules } from "./rules"

registerEdgeKind("FORM_COMMAND", { yaml: "КомандаФормы", owning: true })

registerTypeRule("FormCommands", "graphChild", {
  idFrom: "name",
  edgeKind: "FORM_COMMAND",
  edgeYaml: "КомандаФормы",
  nodeSegment: "Command",
  itemRule: FormCommandRules,
})
