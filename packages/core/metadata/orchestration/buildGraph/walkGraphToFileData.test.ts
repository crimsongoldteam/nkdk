import { describe, expect, it } from "vitest"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { walkGraphToFileData } from "./walkGraphToFileData"

describe("walkGraphToFileData", () => {
  it("возвращает [] для пустого графа", () => {
    const g = new MetadataGraph()
    expect(walkGraphToFileData(g)).toEqual([])
  })

  it("группирует узлы по filePath, лейбл из item.itemType", () => {
    const g = new MetadataGraph()
    g.promoteNode("Справочник.К", {
      name: "К",
      filePaths: ["a.yaml"],
      item: { itemType: "MetadataCatalog", codeLength: 9 },
    })
    g.promoteNode("Документ.Д", {
      name: "Д",
      filePaths: ["b.yaml"],
      item: { itemType: "MetadataDocument", numberLength: 5 },
    })

    const result = walkGraphToFileData(g)
    expect(result).toHaveLength(2)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.nodes).toEqual([
      {
        id: "Справочник.К",
        label: "MetadataCatalog",
        props: { name: "К", filePath: "a.yaml", p_codeLength: 9 },
      },
    ])
    expect(fileB.nodes).toEqual([
      {
        id: "Документ.Д",
        label: "MetadataDocument",
        props: { name: "Д", filePath: "b.yaml", p_numberLength: 5 },
      },
    ])
  })

  it("ребро попадает в FileGraphData файла-источника", () => {
    const g = new MetadataGraph()
    g.promoteNode("A", {
      name: "A",
      filePaths: ["a.yaml"],
      item: { itemType: "X" },
    })
    g.promoteNode("B", {
      name: "B",
      filePaths: ["b.yaml"],
      item: { itemType: "X" },
    })
    g.ensureEdge("A:VALUE:B", "A", "B", { yaml: "Значение", kind: "VALUE" })

    const result = walkGraphToFileData(g)
    const fileA = result.find((f) => f.filePath === "a.yaml")!
    const fileB = result.find((f) => f.filePath === "b.yaml")!
    expect(fileA.edges).toEqual([
      { src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } },
    ])
    expect(fileB.edges).toEqual([])
  })

  it("стабы (filePaths === undefined) попадают в сегмент с filePath ''", () => {
    const g = new MetadataGraph()
    g.promoteNode("A", {
      name: "A",
      filePaths: ["a.yaml"],
      item: { itemType: "MetadataCatalog" },
    })
    // Stub-узел: ссылка на B без определения
    g.ensureNode("B", { name: "B" })
    g.ensureEdge("A:VALUE:B", "A", "B", { yaml: "Значение", kind: "VALUE" })

    const result = walkGraphToFileData(g)
    const stubFile = result.find((f) => f.filePath === "")!
    expect(stubFile.nodes).toEqual([
      { id: "B", label: "Unknown", props: { name: "B" } },
    ])
  })

  it("узлы с двумя filePaths попадают в оба сегмента (для form yaml + nkdk)", () => {
    const g = new MetadataGraph()
    g.promoteNode("Справочник.К.Форма.Ф", {
      name: "Ф",
      filePaths: ["yaml.yaml", "nkdk.nkdk"],
      item: { itemType: "ClientApplicationForm", name: "Ф" },
    })

    const result = walkGraphToFileData(g)
    expect(result.map((f) => f.filePath).sort()).toEqual(["nkdk.nkdk", "yaml.yaml"])
    for (const f of result) {
      expect(f.nodes).toHaveLength(1)
      expect(f.nodes[0]?.id).toBe("Справочник.К.Форма.Ф")
    }
  })

  it("если item не задан и узел не stub — лейбл Unknown", () => {
    const g = new MetadataGraph()
    g.promoteNode("X", { name: "X", filePaths: ["x.yaml"] })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "x.yaml")!
    expect(file.nodes[0]?.label).toBe("Unknown")
  })
})
