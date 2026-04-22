import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { findSubmap } from "~/metadata/orchestration/property/position"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import type { FormAttributeColumn } from "./types"

const COLUMN_EDGE = "КолонкаФормы"

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

/**
 * Обрабатывает коллекцию колонок реквизита формы (FormAttributeColumns).
 *
 * PRD #115: различает два вида колонок по форме первого элемента:
 * - inner (тип реквизита = ТаблицаЗначений / ДеревоЗначений / СписокВыбора):
 *   каждая колонка → узел <реквизит>.<имяКолонки> + owning-ребро «КолонкаФормы»
 *   + рекурсивный buildGraphFromModel для TypeDescription (ребро «Тип»).
 * - additional (дополнительные колонки к реквизитам прикладного объекта):
 *   обработка отложена до среза #116 (no-op здесь).
 */
registerTypeRule("FormAttributeColumns", "buildGraphFromModel", ({
  model,
  parentNodeId,
  filePath,
  yamlMap,
  propRule,
  graph,
}) => {
  if (!Array.isArray(model) || model.length === 0) return

  // Discriminate: если первый элемент имеет строковое поле table — это additional-ветка
  const first = model[0] as Record<string, unknown>
  if (typeof first.table === "string") {
    // Additional columns — обрабатываются в срезе #116
    return
  }

  // Inner columns
  const columnsKey = propRule.yaml // "Колонки"
  const columnsYamlMap = columnsKey && yamlMap ? findSubmap(yamlMap, columnsKey) : undefined

  for (const raw of model) {
    const column = raw as FormAttributeColumn
    const columnName = column.name
    if (!columnName) continue

    const columnNodeId = `${parentNodeId}.${columnName}`
    const columnYamlMap = columnsYamlMap ? findSubmap(columnsYamlMap, columnName) : undefined

    graph.promoteNode(columnNodeId, {
      name: columnName,
      filePaths: [filePath],
      item: column,
    })

    const edgeKey = `${parentNodeId}:${COLUMN_EDGE}:${columnNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, columnNodeId, {
      yaml: COLUMN_EDGE,
      kind: COLUMN_EDGE,
    })

    buildGraphFromModel({
      model: column as Record<string, unknown>,
      yamlMap: columnYamlMap,
      rule: FormAttributeColumnRules,
      graph,
      parentNodeId: columnNodeId,
      filePath,
    })
  }
})
