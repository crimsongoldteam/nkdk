import { describe, expect, it } from "vitest"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"

// setupTests.ts глобально импортирует ~/metadata/commonObjects, что обеспечивает
// регистрацию graphFromModel для MetadataField/MetadataFields.

const baseContext = { version: "2.20", defaultLanguage: "ru" }
const FILE_PATH = "test/Свойства.yaml"

function fieldEdges(graph: MetadataGraph, nodeId: string) {
  return [...graph.outEdgeEntries(nodeId)].filter((e) => e.attributes.kind === "Поле")
}

describe("MetadataFields graph extraction (ВводПоСтроке)", () => {
  it("верхнеуровневый реквизит → ребро Поле к сжатому node ID", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводПоСтроке:
  - Справочник.X.Реквизит.Y
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.X.Y")
  })

  it("реквизит табличной части → сжатый node ID без ТабличнаяЧасть и Реквизит", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводПоСтроке:
  - Справочник.Контрагенты.ТабличнаяЧасть.Контакты.Реквизит.Email
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.Контрагенты.Контакты.Email")
  })

  it("стандартный реквизит → сжатый node ID без СтандартныйРеквизит", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводПоСтроке:
  - Справочник.X.СтандартныйРеквизит.Наименование
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(1)
    expect(edges[0].target).toBe("Справочник.X.Наименование")
  })

  it("несколько ссылок → несколько рёбер Поле", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
  - Справочник.C.Реквизит.П3
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(3)
    const targets = edges.map((e) => e.target).sort()
    expect(targets).toEqual(["Справочник.A.П1", "Справочник.B.П2", "Справочник.C.П3"])
  })

  it("несколько ссылок → разные position-offset'ы", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(2)
    const offsets = edges.map((e) => e.attributes.positionFrom?.offset)
    // Оба offset определены и различны — каждый указывает на свой элемент массива
    expect(offsets[0]).toBeDefined()
    expect(offsets[1]).toBeDefined()
    expect(offsets[0]).not.toBe(offsets[1])
  })

  it("пустой ВводПоСтроке → рёбра Поле не создаются", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const edges = fieldEdges(graph, "Справочник.Товары")
    expect(edges).toHaveLength(0)
  })
})
