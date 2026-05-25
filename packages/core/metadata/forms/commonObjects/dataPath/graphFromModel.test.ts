/**
 * Unit-тесты для buildGraphFromModel DataPath.
 * PRD #118: dataPath-свойства элементов формы → reference-рёбра ПутьКДанным*.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"

// Регистрирует все обработчики элементов формы (включая DataPath через graphFromModel)
import "../../elements"
// Регистрирует graphChild для FormAttributes + TypeDescription extractGraph
import "../formAttribute/graphFromModel"
import "~/metadata/commonObjects/typeDescription/graphFromModel"

const FORM_NODE_ID = "Catalog.Товары.Form.ФормаЭлемента"
const FILE_PATH = "Справочник/Товары/Формы/ФормаЭлемента/Свойства.yaml"

/**
 * Создаёт граф с реквизитом формы «Объект» типа «Catalog.Товары»
 * и несколькими реквизитами прикладного объекта (Наименование, Количество).
 */
function makeGraphWithFormAttribute() {
  const graph = new GraphBuilder()
  // Форма
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаЭлемента" })

  // Реквизит формы «Объект» типа Catalog.Товары
  const attrNodeId = `${FORM_NODE_ID}.Attribute.Объект`
  graph.ensureNode(attrNodeId, { name: "Объект" })
  graph.ensureEdge(FORM_NODE_ID, attrNodeId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })

  // «Тип»-ребро: Объект → Catalog.Товары
  const typeTargetId = "Catalog.Товары"
  graph.ensureNode(typeTargetId, { name: "Товары" })
  graph.ensureEdge(attrNodeId, typeTargetId, "TYPE", { yaml: "Тип" })

  // Стандартные реквизиты прикладного объекта
  graph.ensureNode("Catalog.Товары.StandardAttribute.Description", { name: "Наименование" })
  graph.ensureNode("Catalog.Товары.Количество", { name: "Количество" })

  return graph
}

function makeGraphWithDocumentFormAttribute() {
  const graph = new GraphBuilder()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаЭлемента" })

  const attrNodeId = `${FORM_NODE_ID}.Attribute.Объект`
  graph.ensureNode(attrNodeId, { name: "Объект" })
  graph.ensureEdge(FORM_NODE_ID, attrNodeId, "FORM_ATTRIBUTE", { yaml: "РеквизитФормы" })

  const typeTargetId = "Document.Заказ"
  graph.ensureNode(typeTargetId, { name: "Заказ" })
  graph.ensureEdge(attrNodeId, typeTargetId, "TYPE", { yaml: "Тип" })
  graph.ensureNode("Document.Заказ.TabularSection.Товары", { name: "Товары" })
  graph.ensureEdge(typeTargetId, "Document.Заказ.TabularSection.Товары", "TABULAR_SECTION", {
    yaml: "ТабличнаяЧасть",
  })

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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    expect(graph.hasNode(elementNodeId)).toBe(true)

    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(1)
    expect(dataPathEdges[0].target).toBe("Catalog.Товары.StandardAttribute.Description")
    expect(dataPathEdges[0].attributes).toMatchObject({
      yaml: "ПутьКДанным",
      property: "dataPath",
      sourcePath: "Объект.Наименование",
      pathMode: "formLocal",
    })
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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Catalog.Товары.Количество")
    expect(edges[0].attributes).toMatchObject({
      yaml: "ПутьКДаннымПодвала",
      property: "footerDataPath",
      sourcePath: "Объект.Количество",
      pathMode: "formLocal",
    })
  })

  it("form-local standard attribute ведёт к StandardAttribute", () => {
    const graph = makeGraphWithDocumentFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [{ name: "ПолеНомера", itemType: "InputField", dataPath: "Объект.Number" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеНомера`
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(1)
    expect(dataPathEdges[0].target).toBe("Document.Заказ.StandardAttribute.Number")
  })

  it("form-local табличная часть ведёт к TabularSection", () => {
    const graph = makeGraphWithDocumentFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [{ name: "ТаблицаТоваров", itemType: "Table", dataPath: "Объект.Товары" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const elementNodeId = `${FORM_NODE_ID}.Element.ТаблицаТоваров`
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(1)
    expect(dataPathEdges[0].target).toBe("Document.Заказ.TabularSection.Товары")
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

    const elementNodeId = `${FORM_NODE_ID}.Element.Группа1`
    const edges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Catalog.Товары.StandardAttribute.Description")
    expect(edges[0].attributes).toMatchObject({
      yaml: "ПутьКДаннымЗаголовка",
      property: "titleDataPath",
      sourcePath: "Объект.Наименование",
      pathMode: "formLocal",
    })
  })

  it("не создаёт legacy-рёбра для footerDataPath и titleDataPath", () => {
    const graph = makeGraphWithFormAttribute()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "ПолеВвода1",
            itemType: "InputField",
            footerDataPath: "Объект.Количество",
          },
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

    const inputFieldNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    const groupNodeId = `${FORM_NODE_ID}.Element.Группа1`
    const legacyKinds = new Set([
      "FOOTER_DATA_PATH",
      "TITLE_DATA_PATH",
      "ROW_PICTURE_DATA_PATH",
    ])

    expect(
      [...graph.outEdgeEntries(inputFieldNodeId)].some((e) =>
        legacyKinds.has(e.attributes.kind),
      ),
    ).toBe(false)
    expect(
      [...graph.outEdgeEntries(groupNodeId)].some((e) => legacyKinds.has(e.attributes.kind)),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Сценарии с отсутствующими узлами
// ---------------------------------------------------------------------------

describe("DataPath buildGraphFromModel — edge-cases", () => {
  it("несуществующий первый сегмент → ребро не создаётся, стаб не создаётся", () => {
    const graph = makeGraphWithFormAttribute()
    const nodeCountBefore = [...graph.nodes()].length

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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    expect(dataPathEdges).toHaveLength(0)
    // Новых узлов не появилось (кроме самого элемента)
    expect([...graph.nodes()].length).toBe(nodeCountBefore + 1)
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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    const dataPathEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "DATA_PATH",
    )
    // Ребро создано (к заглушке)
    expect(dataPathEdges).toHaveLength(1)
    const stubId = dataPathEdges[0].target
    expect(stubId).toBe("Catalog.Товары.НесуществующийРеквизит")
    // В GraphBuilder stub-узел имеет пустой массив filePaths (не undefined)
    expect(graph.getNodeAttributes(stubId).filePaths).toEqual([])
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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
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

    const elementNodeId = `${FORM_NODE_ID}.Element.ПолеВвода1`
    const typeEdges = [...graph.outEdgeEntries(elementNodeId)].filter(
      (e) => e.attributes.kind === "AVAILABLE_TYPES",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Catalog.Товары")
  })
})
