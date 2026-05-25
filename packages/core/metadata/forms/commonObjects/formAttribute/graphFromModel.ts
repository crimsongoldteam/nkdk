import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { findSubmap } from "~/metadata/orchestration/property/position"
import { buildDataPathGraphOps } from "~/metadata/forms/commonObjects/dataPath/graphOps"
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
  nodeSegment: "Attribute",
  itemRule: FormAttributeRules,
})

const buildFormAttributeColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

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

  return [
    {
      children,
      recurse: recurses,
      edgeKind: COLUMN_EDGE_KIND,
      edgeYaml: COLUMN_EDGE_YAML,
    },
  ]
}

const buildFormAttributeAdditionalColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

  // parentNodeId = <formNodeId>.Attribute.<attrName>; формируем formNodeId обратным путём.
  const formNodeId = parentNodeId.split(".").slice(0, -2).join(".")
  const sections: GraphOps[] = []

  for (const raw of model) {
    const group = raw as FormAttributeAdditionalColumns
    const tablePath = group.table
    const lastSegment = tablePath.split(".").pop()
    if (!lastSegment) continue

    const proxyNodeId = `${parentNodeId}.${lastSegment}`

    sections.push({
      children: [
        {
          idSuffix: lastSegment,
          name: lastSegment,
          item: { itemType: "AdditionalColumnsProxy", table: tablePath },
        },
      ],
      edgeKind: ADDITION_EDGE_KIND,
      edgeYaml: ADDITION_EDGE_YAML,
    })

    const tableOps = buildDataPathGraphOps({
      sourcePath: tablePath,
      propertyName: "table",
      edgeYaml: TABLE_EDGE_YAML,
      formNodeId,
      fallbackChildKind: "TabularSection",
    })
    if (tableOps) {
      sections.push({
        ...tableOps,
        edgeKind: TABLE_EDGE_KIND,
        edgeYaml: TABLE_EDGE_YAML,
        formLocalReferences: tableOps.formLocalReferences?.map((reference) => ({
          ...reference,
          parentOverride: proxyNodeId,
        })),
        references: tableOps.references?.map((reference) => ({
          ...reference,
          parentOverride: proxyNodeId,
          edgeProps: {
            ...reference.edgeProps,
            property: "table",
            sourcePath: tablePath,
          },
        })),
      })
    }

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

registerTypeRule("FormAttributeColumns", "buildGraphFromModel", buildFormAttributeColumnsGraph)
registerTypeRule(
  "FormAttributeAdditionalColumns",
  "buildGraphFromModel",
  buildFormAttributeAdditionalColumnsGraph,
)
