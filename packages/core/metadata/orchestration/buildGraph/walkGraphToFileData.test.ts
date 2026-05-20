import { describe, expect, it } from "vitest"
import { GraphBuilder } from "./internal/GraphBuilder"
import { walkGraphToFileData } from "./walkGraphToFileData"

function promote(g: GraphBuilder, id: string, name: string, filePaths: string[], item?: unknown): void {
  g.ensureNode(id, { name })
  for (const fp of filePaths) g.addFilePath(id, fp)
  if (item !== undefined) g.setItem(id, item)
}

describe("walkGraphToFileData", () => {
  it("возвращает [] для пустого графа", () => {
    const g = new GraphBuilder()
    expect(walkGraphToFileData(g)).toEqual([])
  })

  it("группирует узлы по filePath, лейбл из item.itemType", () => {
    const g = new GraphBuilder()
    promote(g, "Справочник.К", "К", ["a.yaml"], { itemType: "MetadataCatalog", codeLength: 9 })
    promote(g, "Документ.Д", "Д", ["b.yaml"], { itemType: "MetadataDocument", numberLength: 5 })

    const result = walkGraphToFileData(g)
    expect(result).toHaveLength(2)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.nodes).toEqual([
      {
        id: "Справочник.К",
        label: "MetadataCatalog",
        props: { name: "К", p_codeLength: 9 },
      },
    ])
    expect(fileA.declaredNodeIds).toEqual(["Справочник.К"])
    expect(fileB.nodes).toEqual([
      {
        id: "Документ.Д",
        label: "MetadataDocument",
        props: { name: "Д", p_numberLength: 5 },
      },
    ])
  })

  it("ребро попадает в FileGraphData файла-источника", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
    promote(g, "B", "B", ["b.yaml"], { itemType: "X" })
    g.ensureEdge("A", "B", "VALUE", { yaml: "Значение" })

    const result = walkGraphToFileData(g)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.edges).toEqual([
      { src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } },
    ])
    expect(fileB.edges).toEqual([])
  })

  it("выгружает числовой index из атрибутов ребра в props", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
    promote(g, "B", "B", ["a.yaml"], { itemType: "Y" })
    g.ensureEdge("A", "B", "ATTRIBUTE", { yaml: "Реквизит", index: 3 })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "a.yaml")!

    expect(file.edges).toEqual([
      { src: "A", tgt: "B", kind: "ATTRIBUTE", props: { yaml: "Реквизит", index: 3 } },
    ])
  })

  it("разворачивает positionFrom в примитивные props ребра", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
    promote(g, "B", "B", ["a.yaml"], { itemType: "Y" })
    g.ensureEdge("A", "B", "VALUE", {
      yaml: "Значение",
      positionFrom: { offset: 42, line: 7, column: 11 },
    })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "a.yaml")!

    expect(file.edges).toEqual([
      {
        src: "A",
        tgt: "B",
        kind: "VALUE",
        props: {
          yaml: "Значение",
          positionFromOffset: 42,
          positionFromLine: 7,
          positionFromColumn: 11,
        },
      },
    ])
  })

  it("не перезаписывает вычисленные props позиции одноименными атрибутами ребра", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
    promote(g, "B", "B", ["a.yaml"], { itemType: "Y" })
    g.ensureEdge("A", "B", "VALUE", {
      yaml: "Значение",
      positionFrom: { offset: 42, line: 7, column: 11 },
      positionFromOffset: 999,
      positionFromLine: 999,
      positionFromColumn: 999,
      index: 3,
    })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "a.yaml")!

    expect(file.edges).toEqual([
      {
        src: "A",
        tgt: "B",
        kind: "VALUE",
        props: {
          yaml: "Значение",
          positionFromOffset: 42,
          positionFromLine: 7,
          positionFromColumn: 11,
          index: 3,
        },
      },
    ])
  })

  it("стабы (filePaths пусты) попадают в сегмент с filePath ''", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "MetadataCatalog" })
    g.ensureNode("B", { name: "B" })
    g.ensureEdge("A", "B", "VALUE", { yaml: "Значение" })

    const result = walkGraphToFileData(g)
    const stubFile = result.find((f) => f.filePath === "")!
    expect(stubFile.nodes).toEqual([
      { id: "B", label: "Unknown", props: { name: "B" } },
    ])
    expect(stubFile.declaredNodeIds).toEqual([])
  })

  it("contributed filePath попадает в contributedNodeIds без дублирования узла", () => {
    const g = new GraphBuilder()
    promote(g, "Справочник.К.Форма.Ф", "Ф", ["yaml.yaml"], {
      itemType: "ClientApplicationForm",
      name: "Ф",
    })
    g.addContributedFilePath("Справочник.К.Форма.Ф", "secondary.yaml")

    const result = walkGraphToFileData(g)
    const yaml = result.find((f) => f.filePath === "yaml.yaml")!
    const secondary = result.find((f) => f.filePath === "secondary.yaml")!

    expect(yaml.declaredNodeIds).toEqual(["Справочник.К.Форма.Ф"])
    expect(secondary.nodes).toEqual([])
    expect(secondary.contributedNodeIds).toEqual(["Справочник.К.Форма.Ф"])
  })

  it("если item не задан и узел не stub — лейбл Unknown", () => {
    const g = new GraphBuilder()
    promote(g, "X", "X", ["x.yaml"])

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "x.yaml")!
    expect(file.nodes[0]?.label).toBe("Unknown")
  })

  it("не выгружает в props ключи из flattenSkipKeys узла", () => {
    const g = new GraphBuilder()
    promote(g, "Справочник.К", "К", ["catalog.yaml"], {
      itemType: "MetadataCatalog",
      name: "К",
      attributes: { Total: "Строка" },
      synonym: { items: { ru: "К" } },
    })
    g.addFlattenSkipKeys("Справочник.К", ["attributes"])

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "catalog.yaml")!

    expect(file.nodes[0]?.props).toEqual({
      name: "К",
      p_name: "К",
      p_synonym_items_ru: "К",
    })
  })
})
