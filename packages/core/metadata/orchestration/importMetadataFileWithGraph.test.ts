import { describe, expect, it } from "vitest"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "./importMetadataFileWithGraph"

const baseContext = {
  version: "2.20",
  defaultLanguage: "ru",
}

const FILE_PATH = "test/Свойства.yaml"

describe("importMetadataFileWithGraph — catalog", () => {
  it("возвращает модель и parsed для пустого справочника", () => {
    const graph = new MetadataGraph()
    const result = importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataCatalog")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узел реквизита в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Реквизиты:
  Наименование:
    Тип: Строка(100)
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.Наименование")).toBe(true)
  })

  it("добавляет ребро ссылки на TypeDescription в граф", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const refNodes = graph.nodes().filter((id) => id.includes("Контрагенты"))
    expect(refNodes.length).toBeGreaterThan(0)
  })
})

describe("importMetadataFileWithGraph — document", () => {
  it("возвращает модель и parsed для пустого документа", () => {
    const graph = new MetadataGraph()
    const result = importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "document",
      name: "РасходнаяНакладная",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataDocument")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узел реквизита документа в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Реквизиты:
  Склад:
    Тип: Строка(100)
`,
      kind: "document",
      name: "РасходнаяНакладная",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Документ.РасходнаяНакладная.Склад")).toBe(true)
  })
})

describe("importMetadataFileWithGraph — enumeration", () => {
  it("возвращает модель и parsed для перечисления", () => {
    const graph = new MetadataGraph()
    const result = importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Значения:
  Открыт: {}
  Закрыт: {}
`,
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataEnumeration")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узлы значений перечисления в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Значения:
  Открыт: {}
  Закрыт: {}
`,
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Перечисление.СтатусЗаказа.Открыт")).toBe(true)
    expect(graph.hasNode("Перечисление.СтатусЗаказа.Закрыт")).toBe(true)
  })
})

describe("importMetadataFileWithGraph — неизвестный kind", () => {
  it("бросает ошибку для неизвестного kind", () => {
    const graph = new MetadataGraph()
    expect(() =>
      importMetadataFileWithGraph({
        filePath: FILE_PATH,
        text: "{}",
        kind: "unknown" as never,
        name: "Тест",
        graph,
        context: baseContext,
      })
    ).toThrow('importMetadataFileWithGraph: неизвестный kind "unknown"')
  })
})

describe("importMetadataFileWithGraph — возвращает undefined при пустом импорте", () => {
  it("возвращает undefined если importXxxFromYAML вернул undefined (несовместимые данные)", () => {
    const graph = new MetadataGraph()
    // null вместо объекта: валидный YAML, но import вернёт undefined
    const result = importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "~",
      kind: "catalog",
      name: "Пустой",
      graph,
      context: baseContext,
    })
    expect(result).toBeUndefined()
  })
})
