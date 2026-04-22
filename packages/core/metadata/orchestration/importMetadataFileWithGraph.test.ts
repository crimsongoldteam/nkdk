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
  ДатаСоздания:
    Тип: Строка(100)
`,
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.ДатаСоздания")).toBe(true)
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

describe("importMetadataFileWithGraph — MetadataItemLinks (document)", () => {
  it("добавляет ребро kind Объект для одной ссылки в ВводитсяНаОсновании", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
ВводитсяНаОсновании:
  - Справочник.Контрагенты
`,
      kind: "document",
      name: "ПриёмНаРаботу",
      graph,
      context: baseContext,
    })

    const docNodeId = "Документ.ПриёмНаРаботу"
    const outEdges = [...graph.outEdgeEntries(docNodeId)]
    const objEdges = outEdges.filter((e) => e.attributes.kind === "Объект")
    expect(objEdges).toHaveLength(1)
    expect(graph.hasNode("Справочник.Контрагенты")).toBe(true)
    // stub-узел не должен иметь filePath
    expect(graph.getNodeAttribute("Справочник.Контрагенты", "filePath")).toBeUndefined()
  })

  it("добавляет N рёбер kind Объект с разными позициями для массива Движения", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Движения:
  - РегистрСведений.Продажи
  - РегистрСведений.Закупки
`,
      kind: "document",
      name: "Накладная",
      graph,
      context: baseContext,
    })

    const docNodeId = "Документ.Накладная"
    const outEdges = [...graph.outEdgeEntries(docNodeId)]
    const objEdges = outEdges.filter((e) => e.attributes.kind === "Объект")
    expect(objEdges).toHaveLength(2)

    expect(graph.hasNode("РегистрСведений.Продажи")).toBe(true)
    expect(graph.hasNode("РегистрСведений.Закупки")).toBe(true)

    // позиции у разных элементов должны различаться
    const positions = objEdges.map((e) => e.attributes.positionFrom?.offset)
    expect(positions[0]).toBeDefined()
    expect(positions[1]).toBeDefined()
    expect(positions[0]).not.toBe(positions[1])
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

describe("importMetadataFileWithGraph — graphTerminals (ПустаяСсылка)", () => {
  it("создаёт узел ПустаяСсылка для справочника", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(true)
  })

  it("узел ПустаяСсылка имеет item с itemType=EmptyRef и filePath", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const nodeId = "Справочник.Товары.ПустаяСсылка"
    const item = graph.getNodeAttribute(nodeId, "item") as Record<string, string>
    expect(item.itemType).toBe("EmptyRef")
    expect(item.ownerType).toBe("Справочник")
    expect(item.ownerName).toBe("Товары")
    expect(graph.getNodeAttribute(nodeId, "filePath")).toBe(FILE_PATH)
  })

  it("getBrokenReferences не включает узел ПустаяСсылка (item установлен)", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const broken = graph.getBrokenReferences()
    expect(broken.has("Справочник.Товары.ПустаяСсылка")).toBe(false)
  })

  it("invalidateFile удаляет узел ПустаяСсылка; повторный импорт восстанавливает", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(true)

    graph.invalidateFile(FILE_PATH)
    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(false)

    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })
    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(true)
  })

  it("создаёт узел ПустаяСсылка для документа и перечисления", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "document",
      name: "Накладная",
      graph,
      context: baseContext,
    })
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: `
Значения:
  Активен: {}
`,
      kind: "enumeration",
      name: "Статус",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Документ.Накладная.ПустаяСсылка")).toBe(true)
    expect(graph.hasNode("Перечисление.Статус.ПустаяСсылка")).toBe(true)
  })

  it("stub-узел ПустаяСсылка, созданный до импорта владельца, повышается до полного через promoteNode", () => {
    const graph = new MetadataGraph()

    // Эмулируем стаб: другой объект ссылается на ПустаяСсылка до импорта Товары
    const stubId = "Справочник.Товары.ПустаяСсылка"
    graph.ensureNode(stubId, { name: "ПустаяСсылка" })
    expect(graph.getNodeAttribute(stubId, "item")).toBeUndefined()

    // Теперь импортируем владельца — promoteNode должен заполнить пустые поля
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      text: "{}",
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const item = graph.getNodeAttribute(stubId, "item") as Record<string, string>
    expect(item.itemType).toBe("EmptyRef")
    expect(graph.getNodeAttribute(stubId, "filePath")).toBe(FILE_PATH)
  })
})
