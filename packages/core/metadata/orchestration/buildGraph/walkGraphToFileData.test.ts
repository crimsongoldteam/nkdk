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
  })

  it("узлы с двумя filePaths попадают в оба сегмента (для form yaml + nkdk)", () => {
    const g = new GraphBuilder()
    promote(g, "Справочник.К.Форма.Ф", "Ф", ["yaml.yaml", "nkdk.nkdk"], {
      itemType: "ClientApplicationForm",
      name: "Ф",
    })

    const result = walkGraphToFileData(g)
    expect(result.map((f) => f.filePath).sort()).toEqual(["nkdk.nkdk", "yaml.yaml"])
    for (const f of result) {
      expect(f.nodes).toHaveLength(1)
      expect(f.nodes[0]?.id).toBe("Справочник.К.Форма.Ф")
    }
  })

  it("если item не задан и узел не stub — лейбл Unknown", () => {
    const g = new GraphBuilder()
    promote(g, "X", "X", ["x.yaml"])

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "x.yaml")!
    expect(file.nodes[0]?.label).toBe("Unknown")
  })
})
