import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { FormParameterRules } from "./rules"

/**
 * Регистрирует graphChild для коллекции FormParameters:
 * при построении графа формы каждый параметр становится дочерним узлом
 * с owning-ребром «ПараметрФормы».
 *
 * Kind ребра TypeDescription (Тип) определяется автоматически
 * из yaml-имени свойства по правилу PRD #114.
 */
registerTypeRule("FormParameters", "graphChild", {
  idFrom: "name",
  edgeKind: "FORM_PARAMETER",
  edgeYaml: "ПараметрФормы",
  nodeSegment: "Параметр",
  itemRule: FormParameterRules,
})
