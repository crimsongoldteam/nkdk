import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { FormAttributeRules } from "./rules"

/**
 * Регистрирует graphChild для коллекции FormAttributes:
 * при построении графа формы каждый реквизит становится дочерним узлом
 * с owning-ребром «РеквизитФормы».
 *
 * Kind ребер TypeDescription (Тип, ТипЗначения) определяется автоматически
 * из yaml-имени свойства по правилу PRD #114.
 */
registerTypeRule("FormAttributes", "graphChild", {
  idFrom: "name",
  edgeName: "РеквизитФормы",
  itemRule: FormAttributeRules,
})
