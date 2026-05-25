/**
 * Интеграционный тест: PRD #117
 * Элементы формы — плоские узлы графа + owning-рёбра ЭлементФормы.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { ClientApplicationFormRules } from "../clientApplicationForm/rules"

// Импорт регистрирует все обработчики buildGraphFromModel для элементов формы
import "."

const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
const FORM_NODE_ID = "Catalog.Товары.Form.ФормаСписка"

function makeGraph() {
  const graph = new GraphBuilder()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })
  return graph
}

// ---------------------------------------------------------------------------
// Плоский элемент прямо под формой
// ---------------------------------------------------------------------------

describe("graphFromModel — элементы формы", () => {
  it("создаёт плоский узел для одного элемента с owning-ребром от формы", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [{ name: "Кнопка1", itemType: "Button" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const nodeId = `${FORM_NODE_ID}.Element.Кнопка1`
    expect(graph.hasNode(nodeId)).toBe(true)
    expect(graph.getNodeAttributes(nodeId).name).toBe("Кнопка1")

    const edges = [...graph.outEdgeEntries(FORM_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_ELEMENT",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe(nodeId)
  })

  // ---------------------------------------------------------------------------
  // Группа с вложенным элементом — flat NodeId, ребро от группы
  // ---------------------------------------------------------------------------

  it("дочерний элемент группы получает flat NodeId и owning-ребро от группы", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Группа1",
            itemType: "UsualGroup",
            childItems: [{ name: "ПолеВвода1", itemType: "InputField" }],
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const groupNodeId = `${FORM_NODE_ID}.Element.Группа1`
    const fieldNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`

    // Оба узла существуют
    expect(graph.hasNode(groupNodeId)).toBe(true)
    expect(graph.hasNode(fieldNodeId)).toBe(true)

    // Ребро формы → группа
    const formEdges = [...graph.outEdgeEntries(FORM_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_ELEMENT",
    )
    expect(formEdges.map((e) => e.target)).toContain(groupNodeId)

    // Ребро группы → поле (не форма → поле)
    const groupEdges = [...graph.outEdgeEntries(groupNodeId)].filter(
      (e) => e.attributes.kind === "FORM_ELEMENT",
    )
    expect(groupEdges).toHaveLength(1)
    expect(groupEdges[0].target).toBe(fieldNodeId)

    // Нет прямого ребра форма → поле
    const formToFieldEdge = [...graph.outEdgeEntries(FORM_NODE_ID)].find(
      (e) => e.target === fieldNodeId,
    )
    expect(formToFieldEdge).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // Синглет (ContextMenu): flat NodeId, ребро от формы, не от элемента
  // ---------------------------------------------------------------------------

  it("синглет ContextMenu получает flat NodeId и owning-ребро от формы", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Таблица1",
            itemType: "Table",
            contextMenu: { childItems: [] },
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const tableNodeId = `${FORM_NODE_ID}.Element.Таблица1`
    const menuNodeId = `${FORM_NODE_ID}.Element.Таблица1КонтекстноеМеню`

    expect(graph.hasNode(tableNodeId)).toBe(true)
    expect(graph.hasNode(menuNodeId)).toBe(true)
    expect(graph.getNodeAttributes(menuNodeId).name).toBe("Таблица1КонтекстноеМеню")

    // Ребро от ФОРМЫ к синглету, не от таблицы
    const formEdges = [...graph.outEdgeEntries(FORM_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_ELEMENT",
    )
    expect(formEdges.map((e) => e.target)).toContain(menuNodeId)

    // Таблица не является источником ребра к синглету
    const tableEdges = [...graph.outEdgeEntries(tableNodeId)].filter(
      (e) => e.target === menuNodeId,
    )
    expect(tableEdges).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // filePath сохраняется в узле элемента
  // ---------------------------------------------------------------------------

  it("узел элемента хранит filePath", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [{ name: "Декорация1", itemType: "LabelDecoration" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const nodeId = `${FORM_NODE_ID}.Element.Декорация1`
    const filePaths = graph.getNodeAttributes(nodeId).filePaths
    expect(filePaths).toContain(FILE_PATH)
  })

  it("создаёт OBJECT-ребро для строкового Button.parameter", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПоказатьВСписке",
            itemType: "CommandBarButton",
            parameter: "Document.Встреча",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const buttonNodeId = `${FORM_NODE_ID}.Element.ПоказатьВСписке`
    const edges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (edge) => edge.attributes.kind === "OBJECT"
    )

    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Document.Встреча")
    expect(edges[0].attributes.yaml).toBe("Параметр")
  })

  it("создаёт OBJECT-ребро для Button.parameter с TypeDescription", () => {
    const graph = makeGraph()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "СоздатьПриемНаРаботу",
            itemType: "Button",
            parameter: {
              typeDescription: { type: ["DocumentRef.ПриемНаРаботу"] },
            },
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const buttonNodeId = `${FORM_NODE_ID}.Element.СоздатьПриемНаРаботу`
    const edges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (edge) => edge.attributes.kind === "OBJECT"
    )

    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Document.ПриемНаРаботу")
    expect(edges[0].attributes.yaml).toBe("Параметр")
  })
})
