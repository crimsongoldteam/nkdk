import { describe, expect, it, vi } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { walkGraphToFileData } from "./buildGraph/walkGraphToFileData"
import { importMetadataFileWithGraph } from "./importMetadataFileWithGraph"

const baseContext = {
  version: "2.20",
  defaultLanguage: "ru",
}

const FILE_PATH = "test/Свойства.yaml"

describe("importMetadataFileWithGraph — catalog", () => {
  it("старый вход использует внешнюю регистрацию catalog", async () => {
    const graph = new GraphBuilder()
    const result = await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(result?.model.itemType).toBe("MetadataCatalog")
    expect(graph.hasNode("Справочник.Товары")).toBe(true)
  })

  it("возвращает модель и parsed для пустого справочника", async () => {
    const graph = new GraphBuilder()
    const result = await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataCatalog")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узел реквизита в графе", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  ДатаСоздания:
    Тип: Строка(100)
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.Реквизит.ДатаСоздания")).toBe(true)
  })

  it("добавляет ребро ссылки на TypeDescription в граф", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const refNodes = [...graph.nodes()].filter((id) => id.includes("Контрагенты"))
    expect(refNodes.length).toBeGreaterThan(0)
  })

  it("сохраняет line и column для одиночной YAML-ссылки", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Справочник.Товары.Реквизит.Контрагент"
    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const typeEdges = outEdges.filter((e) => e.attributes.kind === "TYPE")

    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].attributes.positionFrom).toEqual({
      offset: 35,
      line: 4,
      column: 10,
    })
  })

  it("MetadataFields массив сохраняет line и column конкретного элемента", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const outEdges = [...graph.outEdgeEntries("Справочник.Товары")]
    const fieldEdges = outEdges.filter((e) => e.attributes.kind === "FIELD")

    expect(
      fieldEdges.map(({ target, attributes }) => ({
        target,
        positionFrom: attributes.positionFrom,
      })),
    ).toEqual([
      {
        target: "Справочник.A.Реквизит.П1",
        positionFrom: { offset: 19, line: 3, column: 5 },
      },
      {
        target: "Справочник.B.Реквизит.П2",
        positionFrom: { offset: 48, line: 4, column: 5 },
      },
    ])
  })
})

describe("importMetadataFileWithGraph — document", () => {
  it("возвращает модель и parsed для пустого документа", async () => {
    const graph = new GraphBuilder()
    const result = await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "document",
      name: "РасходнаяНакладная",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataDocument")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узел реквизита документа в графе", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  Склад:
    Тип: Строка(100)
` },
      kind: "document",
      name: "РасходнаяНакладная",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Документ.РасходнаяНакладная.Реквизит.Склад")).toBe(true)
  })

  it("не дублирует graphChild record-коллекцию в props родительского узла", async () => {
    const graph = new GraphBuilder()

    await importMetadataFileWithGraph({
      filePath: "Документ/Продажа/Свойства.yaml",
      sources: {
        yaml: [
          "Реквизиты:",
          "  Total: Строка",
          "  VAT:",
          "    Тип: Булево",
        ].join("\n"),
      },
      kind: "document",
      name: "Продажа",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const file = walkGraphToFileData(graph).find(
      (f) => f.filePath === "Документ/Продажа/Свойства.yaml",
    )!
    const parent = file.nodes.find((n) => n.id === "Документ.Продажа")!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_attributes_"))).toBe(false)
  })

  it("сохраняет порядок graphChild record-коллекции через index на рёбрах", async () => {
    const graph = new GraphBuilder()

    await importMetadataFileWithGraph({
      filePath: "Документ/Продажа/Свойства.yaml",
      sources: {
        yaml: [
          "Реквизиты:",
          "  First: Строка",
          "  Second: Булево",
          "  Third: Число(10)",
        ].join("\n"),
      },
      kind: "document",
      name: "Продажа",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const edges = [...graph.outEdgeEntries("Документ.Продажа")]
      .filter((edge) => edge.attributes.kind === "ATTRIBUTE")
      .map((edge) => ({
        target: edge.target,
        index: edge.attributes.index,
      }))

    expect(edges).toEqual([
      { target: "Документ.Продажа.Реквизит.First", index: 0 },
      { target: "Документ.Продажа.Реквизит.Second", index: 1 },
      { target: "Документ.Продажа.Реквизит.Third", index: 2 },
    ])
  })

  it("сохраняет порядок StandardAttributeDescriptions через index и не дублирует props родителя", async () => {
    const graph = new GraphBuilder()

    await importMetadataFileWithGraph({
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      sources: {
        yaml: [
          "СтандартныеРеквизиты:",
          "  Владелец:",
          "    ПроверкаЗаполнения: ВыдаватьОшибку",
          "  Родитель:",
          "    ПроверкаЗаполнения: НеПроверять",
        ].join("\n"),
      },
      kind: "catalog",
      name: "Контрагенты",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const file = walkGraphToFileData(graph).find(
      (f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml",
    )!
    const parent = file.nodes.find((n) => n.id === "Справочник.Контрагенты")!
    const edges = [...graph.outEdgeEntries("Справочник.Контрагенты")]
      .filter((edge) => edge.attributes.kind === "STANDARD_ATTRIBUTE")
      .map((edge) => edge.attributes.index)

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_standardAttributes_"))).toBe(false)
    expect(edges.every((index) => typeof index === "number")).toBe(true)
    expect(edges).toEqual(edges.map((_, index) => index))
  })
})

describe("importMetadataFileWithGraph — enumeration", () => {
  it("возвращает модель и parsed для перечисления", async () => {
    const graph = new GraphBuilder()
    const result = await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Значения:
  Открыт: {}
  Закрыт: {}
` },
      kind: "enumeration",
      name: "СтатусЗаказа",
      graph,
      context: baseContext,
    })

    expect(result).toBeDefined()
    expect(result!.model.itemType).toBe("MetadataEnumeration")
    expect(result!.parsed).toBeDefined()
  })

  it("создаёт узлы значений перечисления в графе", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Значения:
  Открыт: {}
  Закрыт: {}
` },
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
  it("бросает ошибку для неизвестного kind", async () => {
    const graph = new GraphBuilder()
    await expect(
      importMetadataFileWithGraph({
        filePath: FILE_PATH,
        sources: { yaml: "{}" },
        kind: "unknown" as never,
        name: "Тест",
        graph,
        context: baseContext,
      }),
    ).rejects.toThrow('importRegisteredMetadataSourceWithGraph: неизвестный kind "unknown"')
  })
})

describe("importMetadataFileWithGraph — MetadataItemLinks (document)", () => {
  it("добавляет ребро kind Объект для одной ссылки в ВводитсяНаОсновании", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
ВводитсяНаОсновании:
  - Справочник.Контрагенты
` },
      kind: "document",
      name: "ПриёмНаРаботу",
      graph,
      context: baseContext,
    })

    const docNodeId = "Документ.ПриёмНаРаботу"
    const outEdges = [...graph.outEdgeEntries(docNodeId)]
    const objEdges = outEdges.filter((e) => e.attributes.kind === "OBJECT")
    expect(objEdges).toHaveLength(1)
    expect(graph.hasNode("Справочник.Контрагенты")).toBe(true)
    // stub-узел не имеет filePaths (в GraphBuilder — пустой массив)
    expect(graph.getNodeAttributes("Справочник.Контрагенты").filePaths).toEqual([])
  })

  it("добавляет N рёбер kind Объект с разными позициями для массива Движения", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Движения:
  - РегистрСведений.Продажи
  - РегистрСведений.Закупки
` },
      kind: "document",
      name: "Накладная",
      graph,
      context: baseContext,
    })

    const docNodeId = "Документ.Накладная"
    const outEdges = [...graph.outEdgeEntries(docNodeId)]
    const objEdges = outEdges.filter((e) => e.attributes.kind === "OBJECT")
    expect(objEdges).toHaveLength(2)

    expect(graph.hasNode("РегистрСведений.Продажи")).toBe(true)
    expect(graph.hasNode("РегистрСведений.Закупки")).toBe(true)

    expect(
      objEdges.map(({ target, attributes }) => ({
        target,
        positionFrom: attributes.positionFrom,
      })),
    ).toEqual([
      {
        target: "РегистрСведений.Продажи",
        positionFrom: { offset: 15, line: 3, column: 5 },
      },
      {
        target: "РегистрСведений.Закупки",
        positionFrom: { offset: 43, line: 4, column: 5 },
      },
    ])
  })
})

describe("importMetadataFileWithGraph — MetadataValue (ЗначениеЗаполнения)", () => {
  it("сохраняет примитивное MetadataValue в props, если graph-обработчик не создал рёбер", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  Комментарий:
    Тип: Строка
    ЗначениеЗаполнения: '"Черновик"'
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const file = walkGraphToFileData(graph).find((f) => f.filePath === FILE_PATH)!
    const attrNode = file.nodes.find((n) => n.id === "Справочник.Товары.Реквизит.Комментарий")!

    expect(attrNode.props.p_fillValue_type).toBe("string")
    expect(attrNode.props.p_fillValue_value).toBe("Черновик")
  })

  it("ref в ЗначениеЗаполнения реквизита → ребро kind Значение к ПустаяСсылка", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  Ответственный:
    Тип: Справочник.Пользователи
    ЗначениеЗаполнения: Справочник.Пользователи.ПустаяСсылка
` },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Справочник.Товары.Реквизит.Ответственный"
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "VALUE")
    expect(valEdges).toHaveLength(1)
    expect(valEdges[0].target).toBe("Справочник.Пользователи.ПустаяСсылка")
    expect(graph.hasNode("Справочник.Пользователи.ПустаяСсылка")).toBe(true)
  })

  it("ref на значение перечисления → ребро kind Значение к узлу перечисления", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  ВидДоговора:
    Тип: Перечисление.ВидыДоговоров
    ЗначениеЗаполнения: Перечисление.ВидыДоговоров.СПоставщиком
` },
      kind: "catalog",
      name: "Контрагенты",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Справочник.Контрагенты.Реквизит.ВидДоговора"
    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "VALUE")
    expect(valEdges).toHaveLength(1)
    expect(valEdges[0].target).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
  })

  it("fixedArray из N ref → N рёбер kind Значение с разными позициями", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Реквизиты:
  ТипыСчетов:
    ЗначениеЗаполнения:
      - Перечисление.ТипыСчетов.КосвенныеЗатраты
      - Перечисление.ТипыСчетов.Расходы
` },
      kind: "catalog",
      name: "Статьи",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Справочник.Статьи.Реквизит.ТипыСчетов"
    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "VALUE")
    expect(valEdges).toHaveLength(2)

    expect(
      valEdges.map(({ target, attributes }) => ({
        target,
        positionFrom: attributes.positionFrom,
      })),
    ).toEqual([
      {
        target: "Перечисление.ТипыСчетов.КосвенныеЗатраты",
        positionFrom: { offset: 58, line: 5, column: 9 },
      },
      {
        target: "Перечисление.ТипыСчетов.Расходы",
        positionFrom: { offset: 107, line: 6, column: 9 },
      },
    ])
  })
})

describe("importMetadataFileWithGraph — возвращает undefined при пустом импорте", () => {
  it("возвращает undefined если importXxxFromYAML вернул undefined (несовместимые данные)", async () => {
    const graph = new GraphBuilder()
    // null вместо объекта: валидный YAML, но import вернёт undefined
    const result = await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "~" },
      kind: "catalog",
      name: "Пустой",
      graph,
      context: baseContext,
    })
    expect(result).toBeUndefined()
  })
})

describe("importMetadataFileWithGraph — graphTerminals (ПустаяСсылка)", () => {
  it("создаёт узел ПустаяСсылка для справочника", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(true)
  })

  it("узел ПустаяСсылка имеет item с itemType=EmptyRef и filePaths", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const nodeId = "Справочник.Товары.ПустаяСсылка"
    const item = graph.getNodeAttributes(nodeId).item as Record<string, string>
    expect(item.itemType).toBe("EmptyRef")
    expect(item.ownerType).toBe("Справочник")
    expect(item.ownerName).toBe("Товары")
    expect(graph.getNodeAttributes(nodeId).filePaths[0]).toBe(FILE_PATH)
  })

  it("создаёт узел ПустаяСсылка для документа и перечисления", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "document",
      name: "Накладная",
      graph,
      context: baseContext,
    })
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: `
Значения:
  Активен: {}
` },
      kind: "enumeration",
      name: "Статус",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Документ.Накладная.ПустаяСсылка")).toBe(true)
    expect(graph.hasNode("Перечисление.Статус.ПустаяСсылка")).toBe(true)
  })

  it("stub-узел ПустаяСсылка, созданный до импорта владельца, повышается до полного через promoteNode", async () => {
    const graph = new GraphBuilder()

    // Эмулируем стаб: другой объект ссылается на ПустаяСсылка до импорта Товары
    const stubId = "Справочник.Товары.ПустаяСсылка"
    graph.ensureNode(stubId, { name: "ПустаяСсылка" })
    expect(graph.getNodeAttributes(stubId).item).toBeUndefined()

    // Теперь импортируем владельца — setItem должен заполнить пустые поля
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const item = graph.getNodeAttributes(stubId).item as Record<string, string>
    expect(item.itemType).toBe("EmptyRef")
    expect(graph.getNodeAttributes(stubId).filePaths[0]).toBe(FILE_PATH)
  })
})

describe("importMetadataFileWithGraph — form", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
  const NKDK_PATH = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
  const OWNER_NODE_ID = "Справочник.Товары"

  it("создаёт form-узел с owning-ребром Форма от владельца", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: { yaml: "{}" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    expect(graph.hasNode(formNodeId)).toBe(true)

    const outEdges = [...graph.outEdgeEntries(OWNER_NODE_ID)]
    const formEdges = outEdges.filter((e) => e.attributes.kind === "FORM")
    expect(formEdges).toHaveLength(1)
    expect(formEdges[0].target).toBe(formNodeId)
  })

  it("form-узел объявляется только YAML", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: { yaml: "{}" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    const attrs = graph.getNodeAttributes(formNodeId)
    expect(attrs.filePaths).toContain(YAML_PATH)
    expect(attrs.filePaths).not.toContain(NKDK_PATH)
    expect(attrs.contributedFilePaths).not.toContain(NKDK_PATH)
  })

  it("визуальные элементы объявляются YAML при едином файле формы", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: [
          "Элементы:",
          "  ПолеВвода1:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: Реквизит",
          "    Ширина: 10",
          "",
        ].join("\n"),
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    const formFile = walkGraphToFileData(graph).find((file) => file.filePath === YAML_PATH)!

    expect(formFile.declaredNodeIds).toContain(formNodeId)
    expect(formFile.declaredNodeIds?.some((id) => id.startsWith(`${formNodeId}.Элемент.`))).toBe(true)
    expect(walkGraphToFileData(graph).some((file) => file.filePath === NKDK_PATH)).toBe(false)

    const root = formFile.nodes.find((node) => node.id === formNodeId)!
    expect(Object.keys(root.props).some((key) => key.startsWith("p_childItems_"))).toBe(false)
    expect(Object.keys(root.props).some((key) => key.startsWith("p_autoCommandBar_"))).toBe(false)
  })

  it("не обходит все узлы графа после построения визуальных элементов формы", async () => {
    const graph = new GraphBuilder()
    graph.ensureNode("Справочник.Другой.Форма.ФормаСписка.Элемент.Чужой")

    const nodesSpy = vi.spyOn(graph, "nodes")

    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: [
          "Элементы:",
          "  ПолеВвода1:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: Реквизит",
          "    Ширина: 10",
          "",
        ].join("\n"),
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    expect(nodesSpy).not.toHaveBeenCalled()
  })

  it("бросает ошибку если ownerNodeId не передан для form", async () => {
    const graph = new GraphBuilder()
    await expect(
      importMetadataFileWithGraph({
        filePath: YAML_PATH,
        sources: { yaml: "{}" },
        kind: "form",
        name: "ФормаСписка",
        graph,
        context: baseContext,
      }),
    ).rejects.toThrow("importMetadataFileWithGraph: form kind требует ownerNodeId")
  })

  it("создаёт узел реквизита формы с owning-ребром РеквизитФормы", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Контрагент:
    Тип: Строка(100)
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    const attrNodeId = `${formNodeId}.Реквизит.Контрагент`

    expect(graph.hasNode(attrNodeId)).toBe(true)

    const owningEdges = [...graph.outEdgeEntries(formNodeId)].filter(
      (e) => e.attributes.kind === "FORM_ATTRIBUTE",
    )
    expect(owningEdges).toHaveLength(1)
    expect(owningEdges[0].target).toBe(attrNodeId)
  })

  it("реквизит формы с type → reference-ребро Тип к целевому узлу", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    const attrNodeId = `${formNodeId}.Реквизит.Контрагент`

    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("реквизит формы с valueType → reference-ребро ТипЗначения к целевому узлу", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  СписокТоваров:
    ТипЗначения: Справочник.Товары
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.Форма.ФормаСписка`
    const attrNodeId = `${formNodeId}.Реквизит.СписокТоваров`

    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "VALUE_TYPE",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Товары")
  })

  it("реквизиты catalog сохраняют ребро kind Тип после изменения правила yaml-name", async () => {
    // Регрессионный тест: убеждаемся, что после перехода на yaml-name rule
    // реквизиты прикладных объектов по-прежнему создают ребро Тип
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: {
        yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
`,
      },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const attrNodeId = "Справочник.Товары.Реквизит.Контрагент"
    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Контрагенты")
  })
})

describe("importMetadataFileWithGraph — form, FormAttributeColumns (PRD #115)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.Форма.ФормаСписка`

  it("колонки реквизита-таблицы → узлы с owning-ребром КолонкаФормы", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Таблица:
    Тип: ТаблицаЗначений
    Колонки:
      Колонка1:
        Тип: Булево
      Колонка2:
        Тип: Булево
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const attrNodeId = `${FORM_NODE_ID}.Реквизит.Таблица`
    const col1NodeId = `${attrNodeId}.Колонка1`
    const col2NodeId = `${attrNodeId}.Колонка2`

    expect(graph.hasNode(col1NodeId)).toBe(true)
    expect(graph.hasNode(col2NodeId)).toBe(true)

    const colEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "FORM_COLUMN",
    )
    expect(colEdges).toHaveLength(2)
    expect(colEdges.map((e) => e.target)).toContain(col1NodeId)
    expect(colEdges.map((e) => e.target)).toContain(col2NodeId)
  })

  it("колонка с reference-типом → ребро Тип к целевому узлу", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Таблица:
    Тип: ТаблицаЗначений
    Колонки:
      Контрагент:
        Тип: Справочник.Контрагенты
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const colNodeId = `${FORM_NODE_ID}.Реквизит.Таблица.Контрагент`
    expect(graph.hasNode(colNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(colNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("пустые колонки реквизита → узлов КолонкаФормы не создаётся", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Обычный:
    Тип: Строка(100)
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const attrNodeId = `${FORM_NODE_ID}.Реквизит.Обычный`
    const colEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "FORM_COLUMN",
    )
    expect(colEdges).toHaveLength(0)
  })
})

describe("importMetadataFileWithGraph — form, FormAttributeAdditionalColumns (PRD #116)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.Форма.ФормаСписка`

  it("дополнительные колонки → прокси-узел + ДополнениеТаблицы + Таблица + ДополнительнаяКолонка", async () => {
    const graph = new GraphBuilder()
    // Импортируем справочник Товары с ТЧ «Состав»
    await importMetadataFileWithGraph({
      filePath: "Справочник/Товары/Свойства.yaml",
      sources: {
        yaml: `
ТабличныеЧасти:
  Состав:
    Реквизиты:
      Количество:
        Тип: Число(10)
`,
      },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    // Импортируем форму: реквизит «Объект» (тип Справочник.Товары) + дополнительные колонки
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    ДополнительныеКолонки:
      "Объект.Состав":
        ДопКолонка:
          Тип: Строка(50)
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const attrNodeId = `${FORM_NODE_ID}.Реквизит.ДопКолонки`
    const proxyNodeId = `${attrNodeId}.Состав`
    const colNodeId = `${proxyNodeId}.ДопКолонка`

    // Прокси-узел создан с item.itemType = "AdditionalColumnsProxy"
    expect(graph.hasNode(proxyNodeId)).toBe(true)
    const item = graph.getNodeAttributes(proxyNodeId).item as Record<string, unknown>
    expect(item.itemType).toBe("AdditionalColumnsProxy")
    expect(item.table).toBe("Объект.Состав")

    // Owning-ребро ДополнениеТаблицы: реквизит → прокси
    const additionEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TABLE_EXTENSION",
    )
    expect(additionEdges).toHaveLength(1)
    expect(additionEdges[0].target).toBe(proxyNodeId)

    // Reference-ребро Таблица: прокси → реальная ТЧ (resolveFormLocalPath находит через edge-traversal)
    const tableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "TABLE",
    )
    expect(tableEdges).toHaveLength(1)
    expect(tableEdges[0].target).toBe("Справочник.Товары.ТабличнаяЧасть.Состав")

    // Узел колонки создан с owning-ребром ДополнительнаяКолонка
    expect(graph.hasNode(colNodeId)).toBe(true)
    const colEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "ADDITIONAL_COLUMN",
    )
    expect(colEdges).toHaveLength(1)
    expect(colEdges[0].target).toBe(colNodeId)
  })

  it("дополнительная колонка с reference-типом → ребро Тип от колонки", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    ДополнительныеКолонки:
      "Объект.Состав":
        Контрагент:
          Тип: Справочник.Контрагенты
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const attrNodeId = `${FORM_NODE_ID}.Реквизит.ДопКолонки`
    const proxyNodeId = `${attrNodeId}.Состав`
    const colNodeId = `${proxyNodeId}.Контрагент`

    expect(graph.hasNode(colNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(colNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("форма импортируется до владельца → Таблица-ребро ведёт на заглушку ТЧ", async () => {
    const graph = new GraphBuilder()

    // Форма импортируется ПЕРВОЙ — владелец ещё не импортирован
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    ДополнительныеКолонки:
      "Объект.Состав":
        ДопКолонка: {}
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const proxyNodeId = `${FORM_NODE_ID}.Реквизит.ДопКолонки.Состав`

    // Таблица-ребро ведёт на заглушку
    const tableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "TABLE",
    )
    expect(tableEdges).toHaveLength(1)
    const stubId = tableEdges[0].target
    expect(stubId).toBe("Справочник.Товары.Состав")
    // Заглушка не имеет item
    expect(graph.getNodeAttributes(stubId).item).toBeUndefined()

    // После импорта владельца — ТЧ создаётся по новому полному пути с сегментом ТабличнаяЧасть
    // Заглушка на старом пути НЕ повышается (будет исправлено в Slice 2 при переписи resolveFormLocalPath)
    await importMetadataFileWithGraph({
      filePath: "Справочник/Товары/Свойства.yaml",
      sources: {
        yaml: `
ТабличныеЧасти:
  Состав:
    Реквизиты:
      Количество:
        Тип: Число(10)
`,
      },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    // Реальная ТЧ создана по новому пути
    expect(graph.hasNode("Справочник.Товары.ТабличнаяЧасть.Состав")).toBe(true)
    expect(graph.getNodeAttributes("Справочник.Товары.ТабличнаяЧасть.Состав").item).toBeDefined()
    // Заглушка на старом пути остаётся без item
    expect(graph.getNodeAttributes(stubId).item).toBeUndefined()
  })
})

describe("importMetadataFileWithGraph — form, FormParameters (PRD #120)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.Форма.ФормаСписка`

  it("создаёт узел параметра формы с owning-ребром ПараметрФормы", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Параметры:
  Период:
    Тип: Дата
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const paramNodeId = `${FORM_NODE_ID}.Параметр.Период`
    expect(graph.hasNode(paramNodeId)).toBe(true)

    const owningEdges = [...graph.outEdgeEntries(FORM_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_PARAMETER",
    )
    expect(owningEdges).toHaveLength(1)
    expect(owningEdges[0].target).toBe(paramNodeId)
  })

  it("параметр формы с type → reference-ребро Тип к целевому узлу", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Параметры:
  Контрагент:
    Тип: Справочник.Контрагенты
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const paramNodeId = `${FORM_NODE_ID}.Параметр.Контрагент`
    const typeEdges = [...graph.outEdgeEntries(paramNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })
})

describe("importMetadataFileWithGraph — form, DataPath-рёбра (PRD #118)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаЭлемента/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.Форма.ФормаЭлемента`

  it("реквизит формы с Тип: Справочник.Товары создаёт ребро Тип (база для resolveFormLocalPath)", async () => {
    const graph = new GraphBuilder()

    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
`,
      },
      kind: "form",
      name: "ФормаЭлемента",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const attrNodeId = `${FORM_NODE_ID}.Реквизит.Объект`
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "TYPE",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Товары")
  })
})

describe("importMetadataFileWithGraph — form, FormCommands (PRD #121)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.Форма.ФормаСписка`

  it("создаёт узел команды формы с owning-ребром КомандаФормы", async () => {
    const graph = new GraphBuilder()
    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Команды:
  ОткрытьВнешний:
    Заголовок: Открыть внешний
`,
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const cmdNodeId = `${FORM_NODE_ID}.Команда.ОткрытьВнешний`
    expect(graph.hasNode(cmdNodeId)).toBe(true)

    const owningEdges = [...graph.outEdgeEntries(FORM_NODE_ID)].filter(
      (e) => e.attributes.kind === "FORM_COMMAND",
    )
    expect(owningEdges).toHaveLength(1)
    expect(owningEdges[0].target).toBe(cmdNodeId)
  })
})
