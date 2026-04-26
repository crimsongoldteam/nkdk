/**
 * Unit-тесты для buildGraphFromModel AssociatedTable.
 * PRD #119: свойство table элементов формы → reference-ребро СвязаннаяТаблица.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"

// Регистрирует все обработчики элементов формы (включая AssociatedTable через graphFromModel)
import "../../elements"
// Регистрирует graphChild для FormAttributes + TypeDescription extractGraph
import "../formAttribute/graphFromModel"
import "~/metadata/commonObjects/typeDescription/graphFromModel"

const FORM_NODE_ID = "Справочник.Товары.Форма.ФормаСписка"
const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"

/**
 * Создаёт граф с узлом формы и узлом элемента-таблицы «ТаблицаТоваров».
 */
function makeGraphWithTableElement() {
  const graph = new MetadataGraph()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

  // Элемент-таблица уже существует в форме
  const tableNodeId = `${FORM_NODE_ID}.Элемент.ТаблицаТоваров`
  graph.promoteNode(tableNodeId, {
    name: "ТаблицаТоваров",
    filePaths: [FILE_PATH],
  })

  return graph
}

// ---------------------------------------------------------------------------
// Основные случаи AssociatedTable
// ---------------------------------------------------------------------------

describe("AssociatedTable buildGraphFromModel — СвязаннаяТаблица", () => {
  it("создаёт reference-ребро СвязаннаяТаблица к существующему элементу-таблице", () => {
    const graph = makeGraphWithTableElement()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Группа1",
            itemType: "UsualGroup",
            table: "ТаблицаТоваров",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Элемент.Группа1`
    expect(graph.hasNode(elementNodeId)).toBe(true)

    const tableEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "ASSOCIATED_TABLE",
    )
    expect(tableEdges).toHaveLength(1)
    expect(tableEdges[0].target).toBe(`${FORM_NODE_ID}.Элемент.ТаблицаТоваров`)
  })

  it("создаёт заглушку и reference-ребро, если элемент-таблица ещё не создан", () => {
    const graph = new MetadataGraph()
    graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Группа1",
            itemType: "UsualGroup",
            table: "НесуществующаяТаблица",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Элемент.Группа1`
    const tableEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "ASSOCIATED_TABLE",
    )
    // Ребро создано (к заглушке)
    expect(tableEdges).toHaveLength(1)
    const stubId = tableEdges[0].target
    expect(stubId).toBe(`${FORM_NODE_ID}.Элемент.НесуществующаяТаблица`)
    // Заглушка не имеет filePaths
    expect(graph.getNodeAttribute(stubId, "filePaths")).toBeUndefined()
  })

  it("пустое значение table → ребро не создаётся", () => {
    const graph = makeGraphWithTableElement()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Группа1",
            itemType: "UsualGroup",
            table: "",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Элемент.Группа1`
    const tableEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "ASSOCIATED_TABLE",
    )
    expect(tableEdges).toHaveLength(0)
  })

  it("TableInputField с table создаёт reference-ребро СвязаннаяТаблица", () => {
    const graph = makeGraphWithTableElement()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "TableInputField",
            table: "ТаблицаТоваров",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Элемент.ПолеВвода1`
    const tableEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "ASSOCIATED_TABLE",
    )
    expect(tableEdges).toHaveLength(1)
    expect(tableEdges[0].target).toBe(`${FORM_NODE_ID}.Элемент.ТаблицаТоваров`)
  })
})
