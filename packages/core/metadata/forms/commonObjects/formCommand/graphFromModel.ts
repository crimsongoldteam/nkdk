/**
 * Регистрирует graphChild для коллекции FormCommands:
 * при построении графа формы каждая команда становится дочерним узлом
 * с owning-ребром «КомандаФормы».
 *
 * PRD #121.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/relations/edgeKinds"
import { FormCommandRules } from "./rules"

registerEdgeKind("КомандаФормы", { owning: true })

registerTypeRule("FormCommands", "graphChild", {
  idFrom: "name",
  edgeName: "КомандаФормы",
  itemRule: FormCommandRules,
})
