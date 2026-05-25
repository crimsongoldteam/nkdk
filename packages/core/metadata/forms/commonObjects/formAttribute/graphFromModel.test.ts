/**
 * Unit-тесты для buildGraphFromModel на FormAttributeColumns.
 * PRD #115: внутренние колонки реквизита-таблицы формы.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"
import { FormAttributeRules } from "./rules"

// Регистрирует graphChild для FormAttributes + buildGraphFromModel для FormAttributeColumns
import "./graphFromModel"
// Регистрирует TypeDescription extractGraph + graphEdgeFromParent (нужны для ребра «Тип»)
import "~/metadata/commonObjects/typeDescription/graphFromModel"

const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
const FORM_NODE_ID = "Catalog.Товары.Form.ФормаСписка"
const ATTR_NODE_ID = `${FORM_NODE_ID}.Attribute.Таблица`

function makeGraph() {
  const graph = new GraphBuilder()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })
  return graph
}

describe("FormAttributeColumns buildGraphFromModel", () => {
  it("объявляет реквизиты формы с каноническим техническим сегментом Attribute", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        attributes: [{ name: "Таблица", itemType: "FormAttribute" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    expect(graph.hasNode("Catalog.Товары.Form.ФормаСписка.Attribute.Таблица")).toBe(true)
    expect(graph.hasNode("Catalog.Товары.Form.ФормаСписка.Реквизит.Таблица")).toBe(false)
  })

  it("пустой массив колонок → узлов не создаётся (no-op)", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "Таблица" })

    buildGraphFromModel({
      model: {
        name: "Таблица",
        columns: [],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    // Нет дочерних узлов с КолонкаФормы-рёбрами
    const edges = [...graph.outEdgeEntries(ATTR_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_COLUMN",
    )
    expect(edges).toHaveLength(0)
  })

  it("inner-колонки → N узлов с owning-рёбрами КолонкаФормы", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "Таблица" })

    buildGraphFromModel({
      model: {
        name: "Таблица",
        columns: [
          { name: "Колонка1", itemType: "FormAttributeColumn" },
          { name: "Колонка2", itemType: "FormAttributeColumn" },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    const col1NodeId = `${ATTR_NODE_ID}.Колонка1`
    const col2NodeId = `${ATTR_NODE_ID}.Колонка2`

    expect(graph.hasNode(col1NodeId)).toBe(true)
    expect(graph.hasNode(col2NodeId)).toBe(true)

    const edges = [...graph.outEdgeEntries(ATTR_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_COLUMN",
    )
    expect(edges).toHaveLength(2)
    expect(edges.map((e) => e.target)).toContain(col1NodeId)
    expect(edges.map((e) => e.target)).toContain(col2NodeId)
  })

  it("inner-колонка с type → reference-ребро Тип к целевому узлу", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "Таблица" })

    buildGraphFromModel({
      model: {
        name: "Таблица",
        columns: [
          {
            name: "Контрагент",
            type: { type: ["CatalogRef.Контрагенты"] },
            itemType: "FormAttributeColumn",
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    const colNodeId = `${ATTR_NODE_ID}.Контрагент`
    expect(graph.hasNode(colNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(colNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Catalog.Контрагенты")
  })

  it("additional-колонки (с полем table) → прокси-узел + ребро ДополнениеТаблицы", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "Объект" })

    buildGraphFromModel({
      model: {
        name: "Объект",
        additionalColumns: [
          {
            table: "КакаяТоТаблица",
            columns: [{ name: "КолонкаТаблицы", itemType: "FormAttributeColumn" }],
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    // Прокси-узел существует
    const proxyNodeId = `${ATTR_NODE_ID}.КакаяТоТаблица`
    expect(graph.hasNode(proxyNodeId)).toBe(true)

    // Owning-ребро «ДополнениеТаблицы» от реквизита к прокси
    const additionEdges = [...graph.outEdgeEntries(ATTR_NODE_ID)].filter(
      (e) => e.attributes.kind === "TABLE_EXTENSION",
    )
    expect(additionEdges).toHaveLength(1)
    expect(additionEdges[0].target).toBe(proxyNodeId)

    // Дочерняя колонка под прокси
    const columnNodeId = `${proxyNodeId}.КолонкаТаблицы`
    expect(graph.hasNode(columnNodeId)).toBe(true)
    const additionalColumnEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "ADDITIONAL_COLUMN",
    )
    expect(additionalColumnEdges).toHaveLength(1)
    expect(additionalColumnEdges[0].target).toBe(columnNodeId)
  })

  it("mixed columns → direct column and additional-column proxy are both created", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "График" })

    buildGraphFromModel({
      model: {
        name: "График",
        columns: [{ name: "Отступ", itemType: "FormAttributeColumn" }],
        additionalColumns: [
          {
            table: "Объект.ГрафикНачислений",
            columns: [{ name: "Сумма", itemType: "FormAttributeColumn" }],
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    const directColumnNodeId = `${ATTR_NODE_ID}.Отступ`
    const proxyNodeId = `${ATTR_NODE_ID}.ГрафикНачислений`
    const additionalColumnNodeId = `${proxyNodeId}.Сумма`

    expect(graph.hasNode(directColumnNodeId)).toBe(true)
    expect(graph.hasNode(proxyNodeId)).toBe(true)
    expect(graph.hasNode(additionalColumnNodeId)).toBe(true)

    expect(
      [...graph.outEdgeEntries(ATTR_NODE_ID)].filter((e) => e.attributes.kind === "FORM_COLUMN"),
    ).toHaveLength(1)
    expect(
      [...graph.outEdgeEntries(ATTR_NODE_ID)].filter((e) => e.attributes.kind === "TABLE_EXTENSION"),
    ).toHaveLength(1)
    expect(
      [...graph.outEdgeEntries(proxyNodeId)].filter(
        (e) => e.attributes.kind === "ADDITIONAL_COLUMN",
      ),
    ).toHaveLength(1)
  })

  it("TABLE form-local путь ведёт к TabularSection", () => {
    const graph = makeGraph()
    const objectAttrId = `${FORM_NODE_ID}.Attribute.Объект`
    graph.ensureNode(objectAttrId, { name: "Объект" })
    graph.ensureEdge(FORM_NODE_ID, objectAttrId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })
    graph.ensureNode("Document.Заказ", { name: "Заказ" })
    graph.ensureEdge(objectAttrId, "Document.Заказ", "TYPE", { yaml: "Тип" })
    graph.ensureNode("Document.Заказ.TabularSection.Товары", { name: "Товары" })
    graph.ensureEdge("Document.Заказ", "Document.Заказ.TabularSection.Товары", "TABULAR_SECTION", {
      yaml: "ТабличнаяЧасть",
    })

    const attrNodeId = `${FORM_NODE_ID}.Attribute.ДопКолонки`
    graph.ensureNode(attrNodeId, { name: "ДопКолонки" })

    buildGraphFromModel({
      model: {
        name: "ДопКолонки",
        additionalColumns: [
          {
            table: "Объект.Товары",
            columns: [{ name: "Количество", itemType: "FormAttributeColumn" }],
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: attrNodeId,
      filePath: FILE_PATH,
    })

    const proxyNodeId = `${attrNodeId}.Товары`
    const tableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "TABLE",
    )
    expect(tableEdges).toHaveLength(1)
    expect(tableEdges[0].target).toBe("Document.Заказ.TabularSection.Товары")
  })

  it("TABLE global путь создаёт ребро от proxy-узла", () => {
    const graph = makeGraph()
    const attrNodeId = `${FORM_NODE_ID}.Attribute.ДопКолонки`
    graph.ensureNode(attrNodeId, { name: "ДопКолонки" })

    buildGraphFromModel({
      model: {
        name: "ДопКолонки",
        additionalColumns: [
          {
            table: "Document.Заказ.TabularSection.Товары",
            columns: [{ name: "Количество", itemType: "FormAttributeColumn" }],
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: attrNodeId,
      filePath: FILE_PATH,
    })

    const proxyNodeId = `${attrNodeId}.Товары`
    const attrTableEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TABLE",
    )
    const proxyTableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "TABLE",
    )
    expect(attrTableEdges).toHaveLength(0)
    expect(proxyTableEdges).toHaveLength(1)
    expect(proxyTableEdges[0].target).toBe("Document.Заказ.TabularSection.Товары")
  })

  it("узел колонки несёт item и filePaths", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "Таблица" })

    buildGraphFromModel({
      model: {
        name: "Таблица",
        columns: [{ name: "Колонка1", itemType: "FormAttributeColumn" }],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    const colNodeId = `${ATTR_NODE_ID}.Колонка1`
    expect(graph.getNodeAttributes(colNodeId).filePaths).toContain(FILE_PATH)
    const item = graph.getNodeAttributes(colNodeId).item as Record<string, unknown>
    expect(item?.itemType).toBe("FormAttributeColumn")
  })
})
