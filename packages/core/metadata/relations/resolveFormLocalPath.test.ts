import { describe, expect, it } from "vitest"
import { MetadataGraph } from "./MetadataGraph"
import { resolveFormLocalPath } from "./resolveFormLocalPath"

const FORM_NODE_ID = "Справочник.Товары.Форма.ФормаЭлемента"
const ATTR_NODE_ID = `${FORM_NODE_ID}.Реквизит.Объект`

function makeGraph(): MetadataGraph {
  const graph = new MetadataGraph()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаЭлемента" })
  graph.ensureNode(ATTR_NODE_ID, { name: "Объект" })
  // Owning-ребро от формы к реквизиту (необходимо для edge-traversal в resolveFormLocalPath)
  graph.ensureEdge(
    `${FORM_NODE_ID}:РеквизитФормы:${ATTR_NODE_ID}`,
    FORM_NODE_ID,
    ATTR_NODE_ID,
    { yaml: "РеквизитФормы", kind: "FORM_ATTRIBUTE" },
  )
  return graph
}

describe("resolveFormLocalPath", () => {
  it("пустой путь → undefined", () => {
    const graph = makeGraph()
    const result = resolveFormLocalPath({ formNodeId: FORM_NODE_ID, path: "", graph })
    expect(result).toBeUndefined()
  })

  it("несуществующий первый сегмент → undefined", () => {
    const graph = makeGraph()
    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "НесуществующийРеквизит.Поле",
      graph,
    })
    expect(result).toBeUndefined()
  })

  it("нет Тип-ребра от реквизита → undefined", () => {
    const graph = makeGraph()
    // Реквизит «Объект» есть и ребро от формы есть, но у него нет Тип-ребра
    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав",
      graph,
    })
    expect(result).toBeUndefined()
  })

  it("плоский реквизит — целевой узел существует → { targetId, stubCreated: false }", () => {
    const graph = makeGraph()
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureNode("Справочник.Товары.Наименование", { name: "Наименование" })
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Наименование",
      graph,
    })

    expect(result).toEqual({ targetId: "Справочник.Товары.Наименование", stubCreated: false })
  })

  it("целевой узел не существует → создаёт заглушку, stubCreated: true", () => {
    const graph = makeGraph()
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав",
      graph,
    })

    expect(result).toEqual({ targetId: "Справочник.Товары.Состав", stubCreated: true })
    expect(graph.hasNode("Справочник.Товары.Состав")).toBe(true)
    // Заглушка не имеет item
    expect(graph.getNodeAttribute("Справочник.Товары.Состав", "item")).toBeUndefined()
  })

  it("промежуточный тип — заглушка (нет item) → стаб целевого узла, stubCreated: true", () => {
    const graph = makeGraph()
    // «Справочник.Товары» — заглушка (нет item, нет filePaths)
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )
    // «Справочник.Товары.Состав» не существует

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав",
      graph,
    })

    expect(result).toEqual({ targetId: "Справочник.Товары.Состав", stubCreated: true })
  })

  it("путь через два уровня (3 сегмента) — промежуточный узел существует", () => {
    const graph = makeGraph()
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureNode("Справочник.Товары.Состав", { name: "Состав" })
    graph.ensureNode("ТипСостава", { name: "ТипСостава" })
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )
    graph.ensureEdge(
      "Состав:Тип:ТипСостава",
      "Справочник.Товары.Состав",
      "ТипСостава",
      { yaml: "Тип", kind: "TYPE" },
    )
    // ТипСостава.Количество не существует

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав.Количество",
      graph,
    })

    expect(result).toEqual({ targetId: "ТипСостава.Количество", stubCreated: true })
  })

  it("путь через два уровня — промежуточный узел отсутствует → undefined", () => {
    const graph = makeGraph()
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )
    // «Справочник.Товары.Состав» не существует — промежуточный сегмент → undefined

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав.Количество",
      graph,
    })

    expect(result).toBeUndefined()
  })

  it("edge-traversal: находит ТЧ по name через ребро ТабличнаяЧасть", () => {
    const graph = makeGraph()
    graph.ensureNode("Справочник.Товары", { name: "Товары" })
    // ТЧ «Состав» создана по сегментированному пути
    graph.ensureNode("Справочник.Товары.ТабличнаяЧасть.Состав", { name: "Состав" })
    graph.ensureEdge(
      "Товары:ТабличнаяЧасть:Состав",
      "Справочник.Товары",
      "Справочник.Товары.ТабличнаяЧасть.Состав",
      { yaml: "ТабличнаяЧасть", kind: "TABULAR_SECTION" },
    )
    graph.ensureEdge(
      "Объект:Тип:Товары",
      ATTR_NODE_ID,
      "Справочник.Товары",
      { yaml: "Тип", kind: "TYPE" },
    )

    const result = resolveFormLocalPath({
      formNodeId: FORM_NODE_ID,
      path: "Объект.Состав",
      graph,
    })

    // edge-traversal находит ТЧ.Состав по name, минуя строковую конкатенацию
    expect(result).toEqual({
      targetId: "Справочник.Товары.ТабличнаяЧасть.Состав",
      stubCreated: false,
    })
  })
})
