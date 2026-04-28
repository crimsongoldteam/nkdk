// @ts-nocheck
// FIXME(phase-4): тесты на старом MetadataGraph API. Адаптировать на GraphBuilder в Phase 4.
/**
 * Unit-тесты для buildGraphFromModel DataPath.
 * PRD #118: dataPath-свойства элементов формы → reference-рёбра ПутьКДанным*.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"

// Регистрирует все обработчики элементов формы (включая DataPath через graphFromModel)
import "../../elements"
// Регистрирует graphChild для FormAttributes + TypeDescription extractGraph
import "../formAttribute/graphFromModel"
import "~/metadata/commonObjects/typeDescription/graphFromModel"

const FORM_NODE_ID = "Справочник.Товары.Форма.ФормаЭлемента"
const FILE_PATH = "Справочник/Товары/Формы/ФормаЭлемента/Свойства.yaml"

/**
 * Создаёт граф с реквизитом формы «Объект» типа «Справочник.Товары»
 * и несколькими реквизитами прикладного объекта (Наименование, Количество).
 */
function makeGraphWithFormAttribute() {
  const graph = new MetadataGraph()
  // Форма
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаЭлемента" })

  // Реквизит формы «Объект» типа Справочник.Товары
  const attrNodeId = `${FORM_NODE_ID}.Реквизит.Объект`
  graph.ensureNode(attrNodeId, { name: "Объект" })
  graph.ensureEdge(`${FORM_NODE_ID}:РеквизитФормы:${attrNodeId}`, FORM_NODE_ID, attrNodeId, {
    yaml: "РеквизитФормы",
    kind: "FORM_ATTRIBUTE",
  })

  // «Тип»-ребро: Объект → Справочник.Товары
  const typeTargetId = "Справочник.Товары"
  graph.ensureNode(typeTargetId, { name: "Товары" })
  graph.ensureEdge(`${attrNodeId}:Тип:${typeTargetId}`, attrNodeId, typeTargetId, {
    yaml: "Тип",
    kind: "TYPE",
  })

  // Реквизиты прикладного объекта
  graph.ensureNode("Справочник.Товары.Наименование", { name: "Наименование" })
  graph.ensureNode("Справочник.Товары.Количество", { name: "Количество" })

  return graph
}

// ---------------------------------------------------------------------------
// Основные случаи DataPath
// ---------------------------------------------------------------------------

describe("DataPath buildGraphFromModel — ПутьКДанным", () => {
  it("создаёт reference-ребро ПутьКДанным к целевому реквизиту", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            dataPath: "Объект.Наименование",
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
    expect(graph.hasNode(elementNodeId)).toBe(true)

    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(1)
    expect(dataPathEdges[0].target).toBe("Справочник.Товары.Наименование")
  })

  it("создаёт reference-ребро ПутьКДаннымПодвала для footerDataPath", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            footerDataPath: "Объект.Количество",
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
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "FOOTER_DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.Товары.Количество")
  })

  it("создаёт reference-ребро ПутьКДаннымЗаголовка для titleDataPath", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "Группа1",
            itemType: "UsualGroup",
            titleDataPath: "Объект.Наименование",
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
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "TITLE_DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.Товары.Наименование")
  })
})

// ---------------------------------------------------------------------------
// Сценарии с отсутствующими узлами
// ---------------------------------------------------------------------------

describe("DataPath buildGraphFromModel — edge-cases", () => {
  it("несуществующий первый сегмент → ребро не создаётся, стаб не создаётся", () => {
    const graph = makeGraphWithFormAttribute()
    const nodeCountBefore = graph.nodes().length

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            dataPath: "НесуществующийРеквизит.Поле",
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
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(0)
    // Новых узлов не появилось (кроме самого элемента)
    expect(graph.nodes().length).toBe(nodeCountBefore + 1)
  })

  it("путь с валидным первым сегментом, но отсутствующим конечным узлом → создаётся заглушка", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            dataPath: "Объект.НесуществующийРеквизит",
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
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    // Ребро создано (к заглушке)
    expect(dataPathEdges).toHaveLength(1)
    const stubId = dataPathEdges[0].target
    expect(stubId).toBe("Справочник.Товары.НесуществующийРеквизит")
    // Заглушка не имеет filePaths (признак stub-узла)
    expect(graph.getNodeAttribute(stubId, "filePaths")).toBeUndefined()
  })

  it("пустой dataPath → ребро не создаётся", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            dataPath: "",
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
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// TypeDescription на элементах (extractGraph через оркестратор)
// ---------------------------------------------------------------------------

describe("extractGraph для TypeDescription на элементах формы", () => {
  it("availableTypes на InputField создаёт reference-ребро ДоступныеТипы", () => {
    // Проверяем, что оркестратор buildGraphFromModel вызывает extractGraph-хендлеры
    // для TypeDescription-свойств элементов формы (а не только buildGraphFromModel-хендлеры).
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            availableTypes: { type: ["CatalogRef.Товары"] },
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
    const typeEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "AVAILABLE_TYPES",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Товары")
  })
})
