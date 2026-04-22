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

  it("создаёт узел реквизита в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    expect(graph.hasNode("Справочник.Товары.ДатаСоздания")).toBe(true)
  })

  it("добавляет ребро ссылки на TypeDescription в граф", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const refNodes = graph.nodes().filter((id) => id.includes("Контрагенты"))
    expect(refNodes.length).toBeGreaterThan(0)
  })
})

describe("importMetadataFileWithGraph — document", () => {
  it("возвращает модель и parsed для пустого документа", () => {
    const graph = new MetadataGraph()
    const result = importMetadataFileWithGraph({
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

  it("создаёт узел реквизита документа в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    expect(graph.hasNode("Документ.РасходнаяНакладная.Склад")).toBe(true)
  })
})

describe("importMetadataFileWithGraph — enumeration", () => {
  it("возвращает модель и parsed для перечисления", () => {
    const graph = new MetadataGraph()
    const result = importMetadataFileWithGraph({
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

  it("создаёт узлы значений перечисления в графе", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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
  it("бросает ошибку для неизвестного kind", () => {
    const graph = new MetadataGraph()
    expect(() =>
      importMetadataFileWithGraph({
        filePath: FILE_PATH,
        sources: { yaml: "{}" },
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
    const objEdges = outEdges.filter((e) => e.attributes.kind === "Объект")
    expect(objEdges).toHaveLength(1)
    expect(graph.hasNode("Справочник.Контрагенты")).toBe(true)
    // stub-узел не должен иметь filePaths
    expect(graph.getNodeAttribute("Справочник.Контрагенты", "filePaths")).toBeUndefined()
  })

  it("добавляет N рёбер kind Объект с разными позициями для массива Движения", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

describe("importMetadataFileWithGraph — MetadataValue (ЗначениеЗаполнения)", () => {
  it("ref в ЗначениеЗаполнения реквизита → ребро kind Значение к ПустаяСсылка", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = "Справочник.Товары.Ответственный"
    expect(graph.hasNode(attrNodeId)).toBe(true)

    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "Значение")
    expect(valEdges).toHaveLength(1)
    expect(valEdges[0].target).toBe("Справочник.Пользователи.ПустаяСсылка")
    expect(graph.hasNode("Справочник.Пользователи.ПустаяСсылка")).toBe(true)
  })

  it("ref на значение перечисления → ребро kind Значение к узлу перечисления", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = "Справочник.Контрагенты.ВидДоговора"
    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "Значение")
    expect(valEdges).toHaveLength(1)
    expect(valEdges[0].target).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
  })

  it("fixedArray из N ref → N рёбер kind Значение с разными позициями", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = "Справочник.Статьи.ТипыСчетов"
    const outEdges = [...graph.outEdgeEntries(attrNodeId)]
    const valEdges = outEdges.filter((e) => e.attributes.kind === "Значение")
    expect(valEdges).toHaveLength(2)

    const positions = valEdges.map((e) => e.attributes.positionFrom?.offset)
    expect(positions[0]).toBeDefined()
    expect(positions[1]).toBeDefined()
    expect(positions[0]).not.toBe(positions[1])

    const targets = valEdges.map((e) => e.target)
    expect(targets).toContain("Перечисление.ТипыСчетов.КосвенныеЗатраты")
    expect(targets).toContain("Перечисление.ТипыСчетов.Расходы")
  })
})

describe("importMetadataFileWithGraph — возвращает undefined при пустом импорте", () => {
  it("возвращает undefined если importXxxFromYAML вернул undefined (несовместимые данные)", () => {
    const graph = new MetadataGraph()
    // null вместо объекта: валидный YAML, но import вернёт undefined
    const result = importMetadataFileWithGraph({
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
  it("создаёт узел ПустаяСсылка для справочника", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    expect(graph.hasNode("Справочник.Товары.ПустаяСсылка")).toBe(true)
  })

  it("узел ПустаяСсылка имеет item с itemType=EmptyRef и filePaths", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
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
    expect(graph.getNodeAttribute(nodeId, "filePaths")?.[0]).toBe(FILE_PATH)
  })

  it("getBrokenReferences не включает узел ПустаяСсылка (item установлен)", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
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
      sources: { yaml: "{}" },
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
      sources: { yaml: "{}" },
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
      sources: { yaml: "{}" },
      kind: "document",
      name: "Накладная",
      graph,
      context: baseContext,
    })
    importMetadataFileWithGraph({
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

  it("stub-узел ПустаяСсылка, созданный до импорта владельца, повышается до полного через promoteNode", () => {
    const graph = new MetadataGraph()

    // Эмулируем стаб: другой объект ссылается на ПустаяСсылка до импорта Товары
    const stubId = "Справочник.Товары.ПустаяСсылка"
    graph.ensureNode(stubId, { name: "ПустаяСсылка" })
    expect(graph.getNodeAttribute(stubId, "item")).toBeUndefined()

    // Теперь импортируем владельца — promoteNode должен заполнить пустые поля
    importMetadataFileWithGraph({
      filePath: FILE_PATH,
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "Товары",
      graph,
      context: baseContext,
    })

    const item = graph.getNodeAttribute(stubId, "item") as Record<string, string>
    expect(item.itemType).toBe("EmptyRef")
    expect(graph.getNodeAttribute(stubId, "filePaths")?.[0]).toBe(FILE_PATH)
  })
})

describe("importMetadataFileWithGraph — form", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const NKDK_PATH = "Справочник/Товары/Формы/ФормаСписка/Модуль.nkdk"
  const OWNER_NODE_ID = "Справочник.Товары"

  it("создаёт form-узел с owning-ребром Форма от владельца", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: { yaml: "{}", nkdk: "" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    expect(graph.hasNode(formNodeId)).toBe(true)

    const outEdges = [...graph.outEdgeEntries(OWNER_NODE_ID)]
    const formEdges = outEdges.filter((e) => e.attributes.kind === "Форма")
    expect(formEdges).toHaveLength(1)
    expect(formEdges[0].target).toBe(formNodeId)
  })

  it("form-узел хранит оба filePaths (yaml + nkdk)", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: { yaml: "{}", nkdk: "" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    const filePaths = graph.getNodeAttribute(formNodeId, "filePaths")
    expect(filePaths).toContain(YAML_PATH)
    expect(filePaths).toContain(NKDK_PATH)
  })

  it("invalidateFile по yaml-пути удаляет form-узел", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: { yaml: "{}", nkdk: "" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    expect(graph.hasNode(formNodeId)).toBe(true)

    graph.invalidateFile(YAML_PATH)
    expect(graph.hasNode(formNodeId)).toBe(false)
  })

  it("invalidateFile по nkdk-пути также удаляет form-узел (co-invalidation)", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: { yaml: "{}", nkdk: "" },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    expect(graph.hasNode(formNodeId)).toBe(true)

    graph.invalidateFile(NKDK_PATH)
    expect(graph.hasNode(formNodeId)).toBe(false)
  })

  it("повторный импорт после инвалидации восстанавливает form-узел", () => {
    const graph = new MetadataGraph()
    const params = {
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: { yaml: "{}", nkdk: "" },
      kind: "form" as const,
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    }

    importMetadataFileWithGraph(params)
    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    expect(graph.hasNode(formNodeId)).toBe(true)

    graph.invalidateFile(YAML_PATH)
    expect(graph.hasNode(formNodeId)).toBe(false)

    importMetadataFileWithGraph(params)
    expect(graph.hasNode(formNodeId)).toBe(true)
  })

  it("бросает ошибку если ownerNodeId не передан для form", () => {
    const graph = new MetadataGraph()
    expect(() =>
      importMetadataFileWithGraph({
        filePath: YAML_PATH,
        sources: { yaml: "{}" },
        kind: "form",
        name: "ФормаСписка",
        graph,
        context: baseContext,
      })
    ).toThrow("importMetadataFileWithGraph: form kind требует ownerNodeId")
  })

  it("создаёт узел реквизита формы с owning-ребром РеквизитФормы", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    const attrNodeId = `${formNodeId}.Контрагент`

    expect(graph.hasNode(attrNodeId)).toBe(true)

    const owningEdges = [...graph.outEdgeEntries(formNodeId)].filter(
      (e) => e.attributes.kind === "РеквизитФормы",
    )
    expect(owningEdges).toHaveLength(1)
    expect(owningEdges[0].target).toBe(attrNodeId)
  })

  it("реквизит формы с type → reference-ребро Тип к целевому узлу", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    const attrNodeId = `${formNodeId}.Контрагент`

    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "Тип",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("реквизит формы с valueType → reference-ребро ТипЗначения к целевому узлу", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const formNodeId = `${OWNER_NODE_ID}.ФормаСписка`
    const attrNodeId = `${formNodeId}.СписокТоваров`

    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "ТипЗначения",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Товары")
  })

  it("реквизиты catalog сохраняют ребро kind Тип после изменения правила yaml-name", () => {
    // Регрессионный тест: убеждаемся, что после перехода на yaml-name rule
    // реквизиты прикладных объектов по-прежнему создают ребро Тип
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = "Справочник.Товары.Контрагент"
    const refEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "Тип",
    )
    expect(refEdges).toHaveLength(1)
    expect(refEdges[0].target).toBe("Справочник.Контрагенты")
  })
})

describe("importMetadataFileWithGraph — form, FormAttributeColumns (PRD #115)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.ФормаСписка`

  it("колонки реквизита-таблицы → узлы с owning-ребром КолонкаФормы", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = `${FORM_NODE_ID}.Таблица`
    const col1NodeId = `${attrNodeId}.Колонка1`
    const col2NodeId = `${attrNodeId}.Колонка2`

    expect(graph.hasNode(col1NodeId)).toBe(true)
    expect(graph.hasNode(col2NodeId)).toBe(true)

    const colEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "КолонкаФормы",
    )
    expect(colEdges).toHaveLength(2)
    expect(colEdges.map((e) => e.target)).toContain(col1NodeId)
    expect(colEdges.map((e) => e.target)).toContain(col2NodeId)
  })

  it("колонка с reference-типом → ребро Тип к целевому узлу", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const colNodeId = `${FORM_NODE_ID}.Таблица.Контрагент`
    expect(graph.hasNode(colNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(colNodeId)].filter(
      (e) => e.attributes.kind === "Тип",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("пустые колонки реквизита → узлов КолонкаФормы не создаётся", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
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

    const attrNodeId = `${FORM_NODE_ID}.Обычный`
    const colEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "КолонкаФормы",
    )
    expect(colEdges).toHaveLength(0)
  })
})

describe("importMetadataFileWithGraph — form, FormAttributeAdditionalColumns (PRD #116)", () => {
  const YAML_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"
  const OWNER_NODE_ID = "Справочник.Товары"
  const FORM_NODE_ID = `${OWNER_NODE_ID}.ФормаСписка`

  it("дополнительные колонки → прокси-узел + ДополнениеТаблицы + Таблица + ДополнительнаяКолонка", () => {
    const graph = new MetadataGraph()
    // Импортируем справочник Товары с ТЧ «Состав»
    importMetadataFileWithGraph({
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
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    Колонки:
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

    const attrNodeId = `${FORM_NODE_ID}.ДопКолонки`
    const proxyNodeId = `${attrNodeId}.Состав`
    const colNodeId = `${proxyNodeId}.ДопКолонка`

    // Прокси-узел создан с item.itemType = "AdditionalColumnsProxy"
    expect(graph.hasNode(proxyNodeId)).toBe(true)
    const item = graph.getNodeAttribute(proxyNodeId, "item") as Record<string, unknown>
    expect(item.itemType).toBe("AdditionalColumnsProxy")
    expect(item.table).toBe("Объект.Состав")

    // Owning-ребро ДополнениеТаблицы: реквизит → прокси
    const additionEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
      (e) => e.attributes.kind === "ДополнениеТаблицы",
    )
    expect(additionEdges).toHaveLength(1)
    expect(additionEdges[0].target).toBe(proxyNodeId)

    // Reference-ребро Таблица: прокси → реальная ТЧ
    const tableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "Таблица",
    )
    expect(tableEdges).toHaveLength(1)
    expect(tableEdges[0].target).toBe("Справочник.Товары.Состав")

    // Узел колонки создан с owning-ребром ДополнительнаяКолонка
    expect(graph.hasNode(colNodeId)).toBe(true)
    const colEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "ДополнительнаяКолонка",
    )
    expect(colEdges).toHaveLength(1)
    expect(colEdges[0].target).toBe(colNodeId)
  })

  it("дополнительная колонка с reference-типом → ребро Тип от колонки", () => {
    const graph = new MetadataGraph()
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    Колонки:
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

    const attrNodeId = `${FORM_NODE_ID}.ДопКолонки`
    const proxyNodeId = `${attrNodeId}.Состав`
    const colNodeId = `${proxyNodeId}.Контрагент`

    expect(graph.hasNode(colNodeId)).toBe(true)

    const typeEdges = [...graph.outEdgeEntries(colNodeId)].filter(
      (e) => e.attributes.kind === "Тип",
    )
    expect(typeEdges).toHaveLength(1)
    expect(typeEdges[0].target).toBe("Справочник.Контрагенты")
  })

  it("форма импортируется до владельца → Таблица-ребро ведёт на заглушку ТЧ", () => {
    const graph = new MetadataGraph()

    // Форма импортируется ПЕРВОЙ — владелец ещё не импортирован
    importMetadataFileWithGraph({
      filePath: YAML_PATH,
      sources: {
        yaml: `
Реквизиты:
  Объект:
    Тип: Справочник.Товары
  ДопКолонки:
    Колонки:
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

    const proxyNodeId = `${FORM_NODE_ID}.ДопКолонки.Состав`

    // Таблица-ребро ведёт на заглушку
    const tableEdges = [...graph.outEdgeEntries(proxyNodeId)].filter(
      (e) => e.attributes.kind === "Таблица",
    )
    expect(tableEdges).toHaveLength(1)
    const stubId = tableEdges[0].target
    expect(stubId).toBe("Справочник.Товары.Состав")
    // Заглушка не имеет item
    expect(graph.getNodeAttribute(stubId, "item")).toBeUndefined()

    // После импорта владельца — заглушка «повышается» через promoteNode
    importMetadataFileWithGraph({
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

    // После промоции — item появился, filePaths заполнены
    expect(graph.getNodeAttribute(stubId, "item")).toBeDefined()
    expect(graph.getNodeAttribute(stubId, "filePaths")).toBeDefined()
  })
})
