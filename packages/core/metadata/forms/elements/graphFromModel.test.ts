/**
 * Интеграционный тест: PRD #117
 * Элементы формы — плоские узлы графа + owning-рёбра ЭлементФормы.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { ClientApplicationFormRules } from "../clientApplicationForm/rules"

// Импорт регистрирует все обработчики buildGraphFromModel для элементов формы
import "."

const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
const FORM_NODE_ID = "Справочник.Товары.ФормаСписка"

function makeGraph() {
  const graph = new MetadataGraph()
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

    const nodeId = `${FORM_NODE_ID}.Элемент.Кнопка1`
    expect(graph.hasNode(nodeId)).toBe(true)
    expect(graph.getNodeAttribute(nodeId, "name")).toBe("Кнопка1")

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

    const groupNodeId = `${FORM_NODE_ID}.Элемент.Группа1`
    const fieldNodeId = `${FORM_NODE_ID}.Элемент.ПолеВвода1`

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

    const tableNodeId = `${FORM_NODE_ID}.Элемент.Таблица1`
    const menuNodeId = `${FORM_NODE_ID}.Элемент.Таблица1КонтекстноеМеню`

    expect(graph.hasNode(tableNodeId)).toBe(true)
    expect(graph.hasNode(menuNodeId)).toBe(true)
    expect(graph.getNodeAttribute(menuNodeId, "name")).toBe("Таблица1КонтекстноеМеню")

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

    const nodeId = `${FORM_NODE_ID}.Элемент.Декорация1`
    const filePaths = graph.getNodeAttribute(nodeId, "filePaths")
    expect(filePaths).toContain(FILE_PATH)
  })
})
