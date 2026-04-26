import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { findSubmap } from "~/metadata/orchestration/property/position"
import { resolveFormLocalPath } from "~/metadata/relations/resolveFormLocalPath"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"
import type { FormAttributeAdditionalColumns, FormAttributeColumn } from "./types"

const COLUMN_EDGE_KIND = "FORM_COLUMN"
const COLUMN_EDGE_YAML = "КолонкаФормы"
const ADDITION_EDGE_KIND = "TABLE_EXTENSION"
const ADDITION_EDGE_YAML = "ДополнениеТаблицы"
const TABLE_EDGE_KIND = "TABLE"
const TABLE_EDGE_YAML = "Таблица"
const ADDITIONAL_COLUMN_EDGE_KIND = "ADDITIONAL_COLUMN"
const ADDITIONAL_COLUMN_EDGE_YAML = "ДополнительнаяКолонка"

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
  edgeKind: "FORM_ATTRIBUTE",
  edgeYaml: "РеквизитФормы",
  nodeSegment: "Реквизит",
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
    // Additional columns (PRD #116)
    // parentNodeId = <formNodeId>.Реквизит.<attrName>; формируем formNodeId обратным путём
    const formNodeId = parentNodeId.split(".").slice(0, -2).join(".")

    for (const raw of model) {
      const group = raw as FormAttributeAdditionalColumns
      const tablePath = group.table // e.g. "Объект.Состав"
      const lastSegment = tablePath.split(".").pop()
      if (!lastSegment) continue

      // Прокси-узел: <реквизит>.<lastSegment>
      const proxyNodeId = `${parentNodeId}.${lastSegment}`
      graph.promoteNode(proxyNodeId, {
        name: lastSegment,
        filePaths: [filePath],
        item: { itemType: "AdditionalColumnsProxy", table: tablePath },
      })

      // Owning-ребро «ДополнениеТаблицы» от реквизита к прокси
      const proxyEdgeKey = `${parentNodeId}:${ADDITION_EDGE_KIND}:${proxyNodeId}`
      graph.ensureEdge(proxyEdgeKey, parentNodeId, proxyNodeId, {
        yaml: ADDITION_EDGE_YAML,
        kind: ADDITION_EDGE_KIND,
      })

      // Резолвим tablePath → NodeId реальной ТЧ; reference-ребро «Таблица»
      const resolved = resolveFormLocalPath({ formNodeId, path: tablePath, graph })
      if (resolved) {
        const tableEdgeKey = `${proxyNodeId}:${TABLE_EDGE_KIND}:${resolved.targetId}`
        graph.ensureEdge(tableEdgeKey, proxyNodeId, resolved.targetId, {
          yaml: TABLE_EDGE_YAML,
          kind: TABLE_EDGE_KIND,
        })
      }

      // Узлы-колонки под прокси
      for (const column of group.columns) {
        const columnName = column.name
        if (!columnName) continue

        const columnNodeId = `${proxyNodeId}.${columnName}`
        graph.promoteNode(columnNodeId, {
          name: columnName,
          filePaths: [filePath],
          item: column,
        })

        const colEdgeKey = `${proxyNodeId}:${ADDITIONAL_COLUMN_EDGE_KIND}:${columnNodeId}`
        graph.ensureEdge(colEdgeKey, proxyNodeId, columnNodeId, {
          yaml: ADDITIONAL_COLUMN_EDGE_YAML,
          kind: ADDITIONAL_COLUMN_EDGE_KIND,
        })

        buildGraphFromModel({
          model: column as Record<string, unknown>,
          yamlMap: undefined,
          rule: FormAttributeColumnRules,
          graph,
          parentNodeId: columnNodeId,
          filePath,
        })
      }
    }
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

    const edgeKey = `${parentNodeId}:${COLUMN_EDGE_KIND}:${columnNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, columnNodeId, {
      yaml: COLUMN_EDGE_YAML,
      kind: COLUMN_EDGE_KIND,
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
