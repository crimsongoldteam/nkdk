import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { findSubmap } from "~/metadata/orchestration/property/position"
import {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
  GraphOpsRecurse,
} from "~/metadata/orchestration/property/fn"
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
 * graphChild для коллекции FormAttributes — оркестратор сам создаёт дочерние узлы.
 */
registerTypeRule("FormAttributes", "graphChild", {
  idFrom: "name",
  edgeKind: "FORM_ATTRIBUTE",
  edgeYaml: "РеквизитФормы",
  nodeSegment: "Реквизит",
  itemRule: FormAttributeRules,
})

/**
 * Обрабатывает коллекцию колонок реквизита формы.
 *
 * - inner: тип реквизита = ТаблицаЗначений / ДеревоЗначений / СписокВыбора.
 *   Колонка → дочерний узел `<реквизит>.<колонка>` + ребро «КолонкаФормы»
 *   + recurse по FormAttributeColumnRules для типов колонки.
 * - additional: дополнительные колонки к реквизитам прикладного объекта.
 *   Прокси-узел `<реквизит>.<lastSeg(table)>` + ребро «ДополнениеТаблицы»,
 *   ребро «Таблица» от прокси к ТЧ через formLocalReferences,
 *   per-column узлы под прокси + рёбра «ДополнительнаяКолонка»
 *   + recurse по FormAttributeColumnRules.
 */
const buildFormAttributeColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

  const first = model[0] as Record<string, unknown>

  // ---- Additional columns (PRD #116) ----
  if (typeof first.table === "string") {
    // parentNodeId = <formNodeId>.Реквизит.<attrName>; формируем formNodeId обратным путём
    const formNodeId = parentNodeId.split(".").slice(0, -2).join(".")
    const sections: GraphOps[] = []

    for (const raw of model) {
      const group = raw as FormAttributeAdditionalColumns
      const tablePath = group.table
      const lastSegment = tablePath.split(".").pop()
      if (!lastSegment) continue

      const proxyNodeId = `${parentNodeId}.${lastSegment}`

      // (1) Прокси-узел: owning-ребро «ДополнениеТаблицы» от реквизита к прокси
      sections.push({
        children: [{
          idSuffix: lastSegment,
          name: lastSegment,
          item: { itemType: "AdditionalColumnsProxy", table: tablePath },
        }],
        edgeKind: ADDITION_EDGE_KIND,
        edgeYaml: ADDITION_EDGE_YAML,
      })

      // (2) Reference-ребро «Таблица» от прокси к ТЧ через resolveFormLocalPath
      sections.push({
        formLocalReferences: [{
          formLocalPath: tablePath,
          formNodeId,
          parentOverride: proxyNodeId,
        }],
        edgeKind: TABLE_EDGE_KIND,
        edgeYaml: TABLE_EDGE_YAML,
      })

      // (3) Дочерние колонки прокси + рекурсия по FormAttributeColumnRules
      const columnChildren: GraphOpsChild[] = []
      const columnRecurses: GraphOpsRecurse[] = []
      for (const column of group.columns) {
        const columnName = column.name
        if (!columnName) continue
        columnChildren.push({
          idSuffix: columnName,
          name: columnName,
          item: column as unknown as Record<string, unknown>,
          parentOverride: proxyNodeId,
        })
        columnRecurses.push({
          model: column as unknown as Record<string, unknown>,
          rule: FormAttributeColumnRules,
          parentNodeId: `${proxyNodeId}.${columnName}`,
        })
      }
      if (columnChildren.length > 0) {
        sections.push({
          children: columnChildren,
          recurse: columnRecurses,
          edgeKind: ADDITIONAL_COLUMN_EDGE_KIND,
          edgeYaml: ADDITIONAL_COLUMN_EDGE_YAML,
        })
      }
    }

    return sections.length > 0 ? sections : undefined
  }

  // ---- Inner columns ----
  const columnsKey = propRule.yaml // "Колонки"
  const columnsYamlMap = columnsKey && yamlMap ? findSubmap(yamlMap, columnsKey) : undefined

  const children: GraphOpsChild[] = []
  const recurses: GraphOpsRecurse[] = []
  for (const raw of model) {
    const column = raw as FormAttributeColumn
    const columnName = column.name
    if (!columnName) continue

    children.push({
      idSuffix: columnName,
      name: columnName,
      item: column as unknown as Record<string, unknown>,
    })
    recurses.push({
      model: column as unknown as Record<string, unknown>,
      yamlMap: columnsYamlMap ? findSubmap(columnsYamlMap, columnName) : undefined,
      rule: FormAttributeColumnRules,
      parentNodeId: `${parentNodeId}.${columnName}`,
    })
  }

  if (children.length === 0) return undefined

  return [{
    children,
    recurse: recurses,
    edgeKind: COLUMN_EDGE_KIND,
    edgeYaml: COLUMN_EDGE_YAML,
  }]
}

registerTypeRule("FormAttributeColumns", "buildGraphFromModel", buildFormAttributeColumnsGraph)
